import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AppSettings } from '@/types/order';
import { scheduleSmartNotifications } from '@/utils/notifications';

const SETTINGS_KEY = '@nkv_settings';

const defaultSettings: AppSettings = {
  reminderEnabled: false,
  reminderTime: '08:00',
  notificationPermissionGranted: false,
};

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

  return useMemo(() => ({ settings, updateSettings, isLoading: settingsQuery.isLoading }), [settings, updateSettings, settingsQuery.isLoading]);
});
