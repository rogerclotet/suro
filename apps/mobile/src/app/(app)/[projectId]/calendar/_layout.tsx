import { Stack } from "expo-router";
import { FONT, useTheme } from "@/theme";

export default function CalendarLayout() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: FONT, color: t.text },
        headerTintColor: t.primary,
        contentStyle: { backgroundColor: t.bg },
      }}
    />
  );
}
