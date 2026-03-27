import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { AppSettings, Order, Company } from '@/types/order';
import { generateRecommendations } from '@/utils/recommendations';

const SETTINGS_KEY = '@nkv_settings';
const ORDERS_CACHE = '@nkv_orders_cache';
const COMPANIES_CACHE = '@nkv_companies_cache';

const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: '08:00',
  notificationPermissionGranted: false,
};

async function fetchOrdersForNotifications(): Promise<{ orders: Order[]; companies: Company[] }> {
  try {
    const [companiesRes, ordersRes] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    if (companiesRes.error) throw companiesRes.error;
    if (ordersRes.error) throw ordersRes.error;

    const companies: Company[] = (companiesRes.data || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
    }));

    const groupMap: Record<string, { companyId: string; date: string; items: { id: string; articleName: string; articleNumber: string; quantity: number; price: number }[] }> = {};
    for (const row of ordersRes.data || []) {
      const gid = row.order_group_id as string;
      if (!groupMap[gid]) {
        groupMap[gid] = {
          companyId: row.company_id as string,
          date: (row.order_date as string) || (row.created_at as string)?.split('T')[0] || '',
          items: [],
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

    const orders: Order[] = Object.entries(groupMap).map(([gid, g]) => ({
      id: gid,
      companyId: g.companyId,
      items: g.items,
      date: g.date,
    }));

    return { orders, companies };
  } catch (e) {
    console.log('[Notifications] Supabase fetch failed, using cache:', e);
    const [ordersRaw, companiesRaw] = await Promise.all([
      AsyncStorage.getItem(ORDERS_CACHE),
      AsyncStorage.getItem(COMPANIES_CACHE),
    ]);
    const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    const companies: Company[] = companiesRaw ? JSON.parse(companiesRaw) : [];
    return { orders, companies };
  }
}

export async function scheduleSmartNotifications() {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();

    const settingsRaw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings: AppSettings = settingsRaw ? JSON.parse(settingsRaw) : defaultSettings;
    if (!settings.reminderEnabled) return;

    const { orders, companies } = await fetchOrdersForNotifications();
    const recs = generateRecommendations(orders, companies, 20);

    if (recs.length === 0) {
      console.log('[Notifications] Inga rekommendationer – inga notiser schemalagda');
      return;
    }

    const now = new Date();
    let scheduled = 0;

    for (const rec of recs) {
      const nextOrderDate = new Date();
      nextOrderDate.setDate(nextOrderDate.getDate() + (rec.avgIntervalDays - rec.daysSinceLastOrder));

      const notifyDate = new Date(nextOrderDate);
      notifyDate.setDate(notifyDate.getDate() - 3);
      notifyDate.setHours(9, 0, 0, 0);

      if (notifyDate <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📦 Dags att beställa snart!',
          body: `${rec.companyName} brukar beställa ${rec.quantity}x ${rec.articleName} var ${rec.avgIntervalDays}:e dag.`,
          sound: true,
          data: { companyId: rec.companyId, articleNumber: rec.articleNumber },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyDate,
        },
      });

      console.log(`[Notifications] Schemalagd notis för ${rec.articleName} – ${notifyDate.toLocaleDateString('sv-SE')}`);
      scheduled++;
    }

    console.log(`[Notifications] Totalt ${scheduled} notiser schemalagda`);
  } catch (e) {
    console.log('[Notifications] Fel:', e);
  }
}
