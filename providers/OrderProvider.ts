import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { Order, Company, OrderItem, SavedArticle, CompanyAnalytics, MonthlyOrderData, ArticleStats } from '@/types/order';
import { generateRecommendations } from '@/utils/recommendations';
import { scheduleSmartNotifications } from '@/utils/notifications';

const ORDERS_CACHE = '@nkv_orders_cache';
const COMPANIES_CACHE = '@nkv_companies_cache';

export const [OrderProvider, useOrders] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name');
        if (error) throw error;
        const mapped: Company[] = (data || []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.name as string,
          contactInfo: (r.contact as string) || (r.phone as string) || undefined,
          contact: (r.contact as string) || undefined,
          phone: (r.phone as string) || undefined,
          email: (r.email as string) || undefined,
          notes: (r.notes as string) || undefined,
        }));
        await AsyncStorage.setItem(COMPANIES_CACHE, JSON.stringify(mapped)).catch(() => {});
        console.log('[OrderProvider] Fetched companies from Supabase:', mapped.length);
        return mapped;
      } catch (e) {
        console.log('[OrderProvider] Supabase companies error, using cache:', e);
        const cached = await AsyncStorage.getItem(COMPANIES_CACHE);
        if (cached) return JSON.parse(cached) as Company[];
        return [];
      }
    },
  });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;

        const groupMap: Record<string, {
          companyId: string;
          date: string;
          deliveryDate?: string;
          notes?: string;
          items: OrderItem[];
          createdAt: string;
        }> = {};

        for (const row of data || []) {
          const gid = row.order_group_id as string;
          if (!groupMap[gid]) {
            groupMap[gid] = {
              companyId: row.company_id as string,
              date: (row.order_date as string) || (row.created_at as string)?.split('T')[0] || '',
              deliveryDate: (row.delivery_date as string) || undefined,
              notes: (row.notes as string) || undefined,
              items: [],
              createdAt: (row.created_at as string) || '',
            };
          }
          groupMap[gid].items.push({
            id: row.id as string,
            articleName: (row.article_name as string) || '',
            articleNumber: row.article_number as string,
            quantity: (row.quantity as number) || 1,
            price: (row.price as number) || 0,
          });
        }

        const mapped: Order[] = Object.entries(groupMap).map(([gid, g]) => ({
          id: gid,
          companyId: g.companyId,
          items: g.items,
          date: g.date,
          deliveryDate: g.deliveryDate,
          notes: g.notes,
        }));

        mapped.sort((a, b) => b.date.localeCompare(a.date));
        await AsyncStorage.setItem(ORDERS_CACHE, JSON.stringify(mapped)).catch(() => {});
        console.log('[OrderProvider] Fetched orders from Supabase:', mapped.length);
        return mapped;
      } catch (e) {
        console.log('[OrderProvider] Supabase orders error, using cache:', e);
        const cached = await AsyncStorage.getItem(ORDERS_CACHE);
        if (cached) return JSON.parse(cached) as Order[];
        return [];
      }
    },
  });

  useEffect(() => {
    if (ordersQuery.data) setOrders(ordersQuery.data);
  }, [ordersQuery.data]);

  useEffect(() => {
    if (companiesQuery.data) setCompanies(companiesQuery.data);
  }, [companiesQuery.data]);

  const addOrderMutation = useMutation({
    mutationFn: async (params: { companyId: string; items: OrderItem[]; date: string; deliveryDate?: string; notes?: string }) => {
      const groupId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const rows = params.items.map(item => ({
        order_group_id: groupId,
        company_id: params.companyId,
        article_number: item.articleNumber,
        article_name: item.articleName,
        quantity: item.quantity,
        price: item.price,
        order_date: params.date,
        delivery_date: params.deliveryDate || null,
        notes: params.notes || null,
      }));
      const { error } = await supabase.from('orders').insert(rows);
      if (error) throw error;
      return { groupId, ...params };
    },
    onSuccess: (result) => {
      const newOrder: Order = {
        id: result.groupId,
        companyId: result.companyId,
        items: result.items,
        date: result.date,
        deliveryDate: result.deliveryDate,
        notes: result.notes,
      };
      setOrders(prev => [newOrder, ...prev]);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void scheduleSmartNotifications();
      console.log('[OrderProvider] Added order:', result.groupId);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderGroupId: string) => {
      const { error } = await supabase.from('orders').delete().eq('order_group_id', orderGroupId);
      if (error) throw error;
      return orderGroupId;
    },
    onSuccess: (orderGroupId) => {
      setOrders(prev => prev.filter(o => o.id !== orderGroupId));
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void scheduleSmartNotifications();
      console.log('[OrderProvider] Deleted order:', orderGroupId);
    },
  });

  const addCompanyMutation = useMutation({
    mutationFn: async (params: { name: string; contactInfo?: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .insert({ name: params.name, contact: params.contactInfo || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const c: Company = {
        id: data.id as string,
        name: data.name as string,
        contactInfo: (data.contact as string) || undefined,
      };
      setCompanies(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name, 'sv')));
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
      console.log('[OrderProvider] Added company:', data.name);
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', companyId);
      if (error) throw error;
      return companyId;
    },
    onSuccess: (companyId) => {
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
      console.log('[OrderProvider] Deleted company:', companyId);
    },
  });

  const addOrder = useCallback(
    (companyId: string, items: OrderItem[], date: string, deliveryDate?: string, notes?: string) => {
      addOrderMutation.mutate({ companyId, items, date, deliveryDate, notes });
    },
    [addOrderMutation]
  );

  const deleteOrder = useCallback(
    (orderId: string) => { deleteOrderMutation.mutate(orderId); },
    [deleteOrderMutation]
  );

  const addCompany = useCallback(
    (name: string, contactInfo?: string) => { addCompanyMutation.mutate({ name, contactInfo }); },
    [addCompanyMutation]
  );

  const deleteCompany = useCallback(
    (companyId: string) => { deleteCompanyMutation.mutate(companyId); },
    [deleteCompanyMutation]
  );

  const savedArticles = useMemo<SavedArticle[]>(() => {
    const map: Record<string, SavedArticle> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = `${order.companyId}_${item.articleNumber}`;
        if (!map[key]) {
          map[key] = {
            id: key,
            companyId: order.companyId,
            articleName: item.articleName,
            articleNumber: item.articleNumber,
            lastPrice: item.price,
            orderCount: 0,
            lastOrderDate: order.date,
          };
        }
        map[key].orderCount += 1;
        if (order.date >= map[key].lastOrderDate) {
          map[key].lastOrderDate = order.date;
          map[key].lastPrice = item.price;
          map[key].articleName = item.articleName;
        }
      }
    }
    return Object.values(map);
  }, [orders]);

  const getArticlesForCompany = useCallback(
    (companyId: string): SavedArticle[] =>
      savedArticles.filter(a => a.companyId === companyId).sort((a, b) => b.orderCount - a.orderCount),
    [savedArticles]
  );

  const deleteSavedArticle = useCallback((_articleId: string) => {}, []);

  const getCompanyAnalytics = useCallback(
    (companyId: string): CompanyAnalytics | null => {
      const companyOrders = orders.filter(o => o.companyId === companyId);
      if (companyOrders.length === 0) return null;
      const company = companies.find(c => c.id === companyId);
      const sorted = [...companyOrders].sort((a, b) => a.date.localeCompare(b.date));
      let totalItems = 0;
      let totalSpent = 0;
      const monthMap: Record<string, { orderCount: number; totalSpent: number; itemCount: number }> = {};
      const articleMap: Record<string, { articleName: string; articleNumber: string; totalQty: number; totalSpent: number; prices: { date: string; price: number }[]; orderCount: number }> = {};

      for (const order of companyOrders) {
        const month = order.date.substring(0, 7);
        if (!monthMap[month]) monthMap[month] = { orderCount: 0, totalSpent: 0, itemCount: 0 };
        monthMap[month].orderCount += 1;
        for (const item of order.items) {
          const cost = item.price * item.quantity;
          totalItems += item.quantity;
          totalSpent += cost;
          monthMap[month].totalSpent += cost;
          monthMap[month].itemCount += item.quantity;
          const artKey = item.articleNumber;
          if (!articleMap[artKey]) {
            articleMap[artKey] = { articleName: item.articleName, articleNumber: item.articleNumber, totalQty: 0, totalSpent: 0, prices: [], orderCount: 0 };
          }
          articleMap[artKey].totalQty += item.quantity;
          articleMap[artKey].totalSpent += cost;
          articleMap[artKey].prices.push({ date: order.date, price: item.price });
          articleMap[artKey].orderCount += 1;
        }
      }

      const monthlyData: MonthlyOrderData[] = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }));
      const topArticles: ArticleStats[] = Object.values(articleMap)
        .map(a => ({
          articleName: a.articleName,
          articleNumber: a.articleNumber,
          totalQuantity: a.totalQty,
          totalSpent: a.totalSpent,
          avgPrice: a.totalSpent / a.totalQty,
          priceHistory: a.prices.sort((x, y) => x.date.localeCompare(y.date)),
          orderCount: a.orderCount,
        }))
        .sort((a, b) => b.orderCount - a.orderCount);

      return {
        companyId,
        companyName: company?.name ?? 'Okänt',
        totalOrders: companyOrders.length,
        totalItems,
        totalSpent,
        firstOrderDate: sorted[0].date,
        lastOrderDate: sorted[sorted.length - 1].date,
        monthlyData,
        topArticles,
      };
    },
    [orders, companies]
  );

  const recommendations = useMemo(
    () => generateRecommendations(orders, companies, 3),
    [orders, companies]
  );

  const getCompanyName = useCallback(
    (companyId: string) => companies.find(c => c.id === companyId)?.name ?? 'Okänt',
    [companies]
  );

  const isLoading = ordersQuery.isLoading || companiesQuery.isLoading;
  const isError = ordersQuery.isError || companiesQuery.isError;
  const isMutating = addOrderMutation.isPending || deleteOrderMutation.isPending || addCompanyMutation.isPending || deleteCompanyMutation.isPending;

  return useMemo(() => ({
    orders, companies, savedArticles, recommendations,
    isLoading, isError, isMutating,
    addOrder, deleteOrder, addCompany, deleteCompany,
    getCompanyName, getArticlesForCompany, deleteSavedArticle, getCompanyAnalytics,
  }), [
    orders, companies, savedArticles, recommendations,
    isLoading, isError, isMutating,
    addOrder, deleteOrder, addCompany, deleteCompany,
    getCompanyName, getArticlesForCompany, deleteSavedArticle, getCompanyAnalytics,
  ]);
});
