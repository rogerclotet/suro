import { Tabs } from "expo-router";
import { type ColorValue, Text } from "react-native";
import { FONT, useTheme } from "@/theme";

const icon =
  (glyph: string) =>
  ({ color }: { color: ColorValue }) => (
    <Text style={{ fontSize: 18, color }}>{glyph}</Text>
  );

export default function ProjectTabs() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: FONT, color: t.text },
        headerTintColor: t.primary,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        tabBarLabelStyle: { fontFamily: FONT },
      }}
    >
      <Tabs.Screen
        name="lists"
        options={{ title: "Lists", tabBarIcon: icon("☑︎") }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerShown: true,
          tabBarIcon: icon("📅"),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: "Notes", headerShown: true, tabBarIcon: icon("📝") }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          headerShown: true,
          tabBarIcon: icon("💶"),
        }}
      />
      <Tabs.Screen
        name="secret-santa"
        options={{
          title: "Secret Santa",
          headerShown: true,
          tabBarIcon: icon("🎁"),
        }}
      />
    </Tabs>
  );
}
