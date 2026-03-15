import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, Order, Company } from '@/types/order';
import { generateRecommendations } from '@/utils/recommendations';

const SETTINGS_KEY = '@nkv_settings';
const ORDERS_KEY = '@nkv_orders';
const COMPANIES_KEY = '@nkv_companies';

const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: '08:00',
  notificationPermissionGranted: false,
};

export async function scheduleSmartNotifications() {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [ordersRaw, companiesRaw, settingsRaw] = await Promise.all([
      AsyncStorage.getItem(ORDERS_KEY),
      AsyncStorage.getItem(COMPANIES_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
    ]);

    const settings: AppSettings = settingsRaw ? JSON.parse(settingsRaw) : defaultSettings;
    if (!settings.reminderEnabled) return;

    const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    const companies: Company[] = companiesRaw ? JSON.parse(companiesRaw) : [];
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
