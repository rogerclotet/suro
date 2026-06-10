import { Stack } from "expo-router";
import { FONT, useTheme } from "@/theme";

// Anchor the stack on the notes list, so a deep link or restored session that
// lands directly on a note still has the list underneath it — and therefore a
// working back button to return to the list.
export const unstable_settings = { initialRouteName: "index" };

export default function NotesLayout() {
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
