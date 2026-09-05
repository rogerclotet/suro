import { Stack } from "expo-router";
import { useGroupRootOptions } from "@/lib/group-navigation";
import { FONT, useTheme } from "@/theme";

export const unstable_settings = { initialRouteName: "index" };

export default function ExpensesLayout() {
  const t = useTheme();
  const rootOptions = useGroupRootOptions("expenses");
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: FONT, color: t.text },
        headerTintColor: t.primary,
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen name="index" options={rootOptions} />
    </Stack>
  );
}
