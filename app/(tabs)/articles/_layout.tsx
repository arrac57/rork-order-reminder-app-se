import { Stack } from "expo-router";
import React from "react";

export default function ArticlesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Artiklar" }} />
    </Stack>
  );
}
