import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Order, Company, OrderItem, SavedArticle, CompanyAnalytics, MonthlyOrderData, ArticleStats } from '@/types/order';
import { defaultCompanies } from '@/mocks/companies';
import { generateRecommendations } from '@/utils/recommendations';
import { scheduleSmartNotifications } from '@/providers/SettingsProvider';

const ORDERS_KEY = '@nkv_orders';
const COMPANIES_KEY = '@nkv_companies';
const SAVED_ARTICLES_KEY = '@nkv_saved_articles';

export const [OrderProvider, useOrders] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>(defaultCompanies);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ORDERS_KEY);
      return stored ? (JSON.parse(stored) as Order[]) : [];
    },
  });

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(COMPANIES_KEY);
      if (stored) return JSON.parse(stored) as Company[];
      await AsyncStorage.setItem(COMPANIES_KEY, JSON.stringify(defaultCompanies));
      return defaultCompanies;
    },
  });

  const savedArticlesQuery = useQuery({
    queryKey: ['savedArticles'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SAVED_ARTICLES_KEY);
      return stored ? (JSON.parse(stored) as SavedArticle[]) : [];
    },
  });

  useEffect(() => {
    if (ordersQuery.data) setOrders(ordersQuery.data);
  }, [ordersQuery.data]);

  useEffect(() => {
    if (companiesQuery.data) setCompanies(companiesQuery.data);
  }, [companiesQuery.data]);

  useEffect(() => {
    if (savedArticlesQuery.data) setSavedArticles(savedArticlesQuery.data);
  }, [savedArticlesQuery.data]);

  const saveOrdersMutation = useMutation({
    mutationFn: async (updated: Order[]) => {
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const saveCompaniesMutation = useMutation({
    mutationFn: async (updated: Company[]) => {
      await AsyncStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const saveArticlesMutation = useMutation({
    mutationFn: async (updated: SavedArticle[]) => {
      await AsyncStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
    },
  });

  const updateSavedArticles = useCallback(
    (companyId: string, items: OrderItem[], date: string) => {
      let updatedArticles = [...savedArticles];
      for (const item of items) {
        const key = `${companyId}_${item.articleNumber}`;
        const existingIdx = updatedArticles.findIndex(
          (a) => a.companyId === companyId && a.articleNumber === item.articleNumber
        );
        if (existingIdx >= 0) {
          updatedArticles[existingIdx] = {
            ...updatedArticles[existingIdx],
            articleName: item.articleName,
            lastPrice: item.price,
            orderCount: updatedArticles[existingIdx].orderCount + 1,
            lastOrderDate: date,
          };
        } else {
          updatedArticles.push({
            id: key + '_' + Date.now(),
            companyId,
            articleName: item.articleName,
            articleNumber: item.articleNumber,
            lastPrice: item.price,
            orderCount: 1,
            lastOrderDate: date,
          });
        }
      }
      setSavedArticles(updatedArticles);
      saveArticlesMutation.mutate(updatedArticles);
      console.log('[OrderProvider] Updated saved articles for company:', companyId);
    },
    [savedArticles, saveArticlesMutation]
  );

  const addOrder = useCallback(
    (companyId: string, items: OrderItem[], date: string, deliveryDate?: string, notes?: string) => {
      const newOrder: Order = {
        id: Date.now().toString(),
        companyId,
        items,
        date,
        deliveryDate,
        notes,
      };
      const updated = [newOrder, ...orders];
      setOrders(updated);
      saveOrdersMutation.mutate(updated);
      updateSavedArticles(companyId, items, date);
      console.log('[OrderProvider] Added order:', newOrder.id);
      // Uppdatera smarta notiser efter ny order
      scheduleSmartNotifications();
    },
    [orders, saveOrdersMutation, updateSavedArticles]
  );

  const deleteOrder = useCallback(
    (orderId: string) => {
      const updated = orders.filter((o) => o.id !== orderId);
      setOrders(updated);
      saveOrdersMutation.mutate(updated);
      console.log('[OrderProvider] Deleted order:', orderId);
      // Uppdatera smarta notiser när en order tas bort
      scheduleSmartNotifications();
    },
    [orders, saveOrdersMutation]
  );

  const addCompany = useCallback(
    (name: string, contactInfo?: string) => {
      const newCompany: Company = {
        id: Date.now().toString(),
        name,
        contactInfo,
      };
      const updated = [...companies, newCompany];
      setCompanies(updated);
      saveCompaniesMutation.mutate(updated);
      console.log('[OrderProvider] Added company:', newCompany.name);
    },
    [companies, saveCompaniesMutation]
  );

  const deleteCompany = useCallback(
    (companyId: string) => {
      const updated = companies.filter((c) => c.id !== companyId);
      setCompanies(updated);
      saveCompaniesMutation.mutate(updated);
      console.log('[OrderProvider] Deleted company:', companyId);
    },
    [companies, saveCompaniesMutation]
  );

  const getArticlesForCompany = useCallback(
    (companyId: string): SavedArticle[] => {
      return savedArticles
        .filter((a) => a.companyId === companyId)
        .sort((a, b) => b.orderCount - a.orderCount);
    },
    [savedArticles]
  );

  const deleteSavedArticle = useCallback(
    (articleId: string) => {
      const updated = savedArticles.filter((a) => a.id !== articleId);
      setSavedArticles(updated);
      saveArticlesMutation.mutate(updated);
      console.log('[OrderProvider] Deleted saved article:', articleId);
    },
    [savedArticles, saveArticlesMutation]
  );

  const getCompanyAnalytics = useCallback(
    (companyId: string): CompanyAnalytics | null => {
      const companyOrders = orders.filter((o) => o.companyId === companyId);
      if (companyOrders.length === 0) return null;

      const company = companies.find((c) => c.id === companyId);
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
        .map((a) => ({
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
    (companyId: string) => companies.find((c) => c.id === companyId)?.name ?? 'Okänt',
    [companies]
  );

  const isLoading = ordersQuery.isLoading || companiesQuery.isLoading;

  return {
    orders,
    companies,
    savedArticles,
    recommendations,
    isLoading,
    addOrder,
    deleteOrder,
    addCompany,
    deleteCompany,
    getCompanyName,
    getArticlesForCompany,
    deleteSavedArticle,
    getCompanyAnalytics,
  };
});
