import { Stack } from "expo-router";
import { FONT, useTheme } from "@/theme";

// Anchor the Home tab on its index (the dashboard) so a deep link straight to
// a nested section (e.g. /<pid>/home/notes) still has the dashboard underneath
// it as a back target.
export const unstable_settings = { initialRouteName: "index" };

export default function HomeLayout() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: FONT, color: t.text },
        headerTintColor: t.primary,
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      {/* files/ and notes/ own their own header via a nested Stack — hide
          this outer one so it doesn't double up with theirs. */}
      <Stack.Screen name="files" options={{ headerShown: false }} />
      <Stack.Screen name="notes" options={{ headerShown: false }} />
    </Stack>
  );
}
