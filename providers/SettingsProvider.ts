import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AppSettings } from '@/types/order';
import { generateRecommendations } from '@/utils/recommendations';

const SETTINGS_KEY = '@nkv_settings';
const ORDERS_KEY = '@nkv_orders';
const COMPANIES_KEY = '@nkv_companies';

const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: '08:00',
  notificationPermissionGranted: false,
};

async function buildNotificationContent() {
  try {
    const [ordersRaw, companiesRaw] = await Promise.all([
      AsyncStorage.getItem(ORDERS_KEY),
      AsyncStorage.getItem(COMPANIES_KEY),
    ]);
    const orders = ordersRaw ? JSON.parse(ordersRaw) : [];
    const companies = companiesRaw ? JSON.parse(companiesRaw) : [];
    const recs = generateRecommendations(orders, companies, 10);

    if (recs.length === 0) return null;

    const top = recs[0];
    const body =
      recs.length === 1
        ? `Dags att beställa ${top.articleName}! Senast för ${top.daysSinceLastOrder} dagar sedan.`
        : `${recs.length} artiklar att beställa! Mest brådskande: ${top.articleName} (${top.daysSinceLastOrder} dagar sedan)`;

    return { title: 'NKV Orderhantering', body };
  } catch {
    return { title: 'NKV Orderhantering', body: 'Dags att kolla dina beställningsrekommendationer!' };
  }
}

async function scheduleReminder(time: string) {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();

    const content = await buildNotificationContent();
    if (!content) {
      console.log('[Settings] Inga rekommendationer – ingen notis schemalagd');
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { ...content, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
    console.log('[Settings] Schemalagd notis kl', time, '–', content.body);
  } catch (e) {
    console.log('[Settings] Fel vid schemaläggning:', e);
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

      if (updated.reminderEnabled && updated.reminderTime) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleReminder(updated.reminderTime);
          if (!updated.notificationPermissionGranted) {
            const final = { ...updated, notificationPermissionGranted: true };
            setSettings(final);
            saveMutation.mutate(final);
          }
        }
      } else if (!updated.reminderEnabled) {
        await cancelReminders();
      }
    },
    [settings, saveMutation]
  );

  return { settings, updateSettings, isLoading: settingsQuery.isLoading };
});
