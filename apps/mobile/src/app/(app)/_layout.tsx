import { Redirect, Stack } from "expo-router";
import { FeedbackProvider } from "@/lib/feedback-state";
import { NotificationsProvider } from "@/lib/notifications";
import { useAuthGate } from "@/lib/offline";
import { usePushNotifications } from "@/lib/push";
import { FONT, useTheme } from "@/theme";
import { SheetHost } from "@/ui";

export const unstable_settings = { initialRouteName: "groups" };

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuthGate();
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
    <NotificationsProvider>
      <SheetHost>
        <FeedbackProvider>
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
            <Stack.Screen name="[projectId]" options={{ headerShown: false }} />
          </Stack>
        </FeedbackProvider>
      </SheetHost>
    </NotificationsProvider>
  );
}
