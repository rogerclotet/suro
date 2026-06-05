import { useConvexAuth } from "convex/react";
import { Redirect, Stack } from "expo-router";
import { usePushNotifications } from "@/lib/push";
import { FONT, useTheme } from "@/theme";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const t = useTheme();
  // Registers the device's push token while signed in and routes notification
  // taps. No-ops when push is unavailable (Expo Go, simulator, pre-EAS).
  usePushNotifications();

  if (isLoading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: FONT, color: t.text },
        headerTintColor: t.primary,
        // Pushed pages (Manage group, Create group, Profile) show a bare
        // chevron, not the stale "[projectId]" previous-route label.
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      {/* The project route is a Tabs navigator; it owns its own headers. */}
      <Stack.Screen name="[projectId]" options={{ headerShown: false }} />
    </Stack>
  );
}
