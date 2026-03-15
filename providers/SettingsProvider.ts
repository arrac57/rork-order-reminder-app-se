import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
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
      // Räkna ut när nästa beställning förväntas
      const nextOrderDate = new Date();
      nextOrderDate.setDate(nextOrderDate.getDate() + (rec.avgIntervalDays - rec.daysSinceLastOrder));

      // Skicka notis 3 dagar innan
      const notifyDate = new Date(nextOrderDate);
      notifyDate.setDate(notifyDate.getDate() - 3);
      notifyDate.setHours(9, 0, 0, 0);

      // Hoppa över om datum redan passerat
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

async function cancelReminders() {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Settings] Alla påminnelser avbokade');
  } catch (e) {
    console.log('[Settings] Fel vid avbokning:', e);
  }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.log('[Settings] Fel vid behörighetsbegäran:', e);
    return false;
  }
}

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      return stored ? (JSON.parse(stored) as AppSettings) : defaultSettings;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (updated: AppSettings) => {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    },
  });

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      saveMutation.mutate(updated);

      if (updated.reminderEnabled) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleSmartNotifications();
          if (!updated.notificationPermissionGranted) {
            const final = { ...updated, notificationPermissionGranted: true };
            setSettings(final);
            saveMutation.mutate(final);
          }
        }
      } else {
        await cancelReminders();
      }
    },
    [settings, saveMutation]
  );

  return { settings, updateSettings, isLoading: settingsQuery.isLoading };
});
