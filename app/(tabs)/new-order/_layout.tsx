import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function NewOrderLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' as const },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Ny Beställning" }} />
    </Stack>
  );
}
