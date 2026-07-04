import { Stack } from "expo-router";
import { FONT, useTheme } from "@/theme";

// Anchor the More tab on its index (the overflow grid) so a deep link straight
// to an overflow section (e.g. /<pid>/more/notes) still has the grid underneath
// it as a back target.
export const unstable_settings = { initialRouteName: "index" };

// The overflow sections (files, notes) are screens in this stack — not nested
// stacks of their own — so they're pushed onto the grid and get a native back
// button to it. This stack owns every header; `index` shows the group badge,
// the pushed sections show the back chevron (`headerBackButtonDisplayMode`).
export default function MoreLayout() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: FONT, color: t.text },
        headerTintColor: t.primary,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: t.bg },
      }}
    />
  );
}
