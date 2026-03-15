import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { OrderProvider } from "@/providers/OrderProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { scheduleSmartNotifications } from "@/utils/notifications";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Tillbaka" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="company-profile" options={{ title: 'Företagsprofil' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
    void scheduleSmartNotifications();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <OrderProvider>
          <SettingsProvider>
            <RootLayoutNav />
          </SettingsProvider>
        </OrderProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
