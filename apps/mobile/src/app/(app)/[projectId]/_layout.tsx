import { Tabs } from "expo-router";
import {
  Calendar,
  FileText,
  Gift,
  HandCoins,
  ListTodo,
  type LucideIcon,
} from "lucide-react-native";
import type { ColorValue } from "react-native";
import { FONT, useTheme } from "@/theme";

// Monochrome lucide icons, matching the PWA's section iconography.
const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Icon color={color as string} size={size} />
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
        options={{ title: "Lists", tabBarIcon: tabIcon(ListTodo) }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerShown: true,
          tabBarIcon: tabIcon(Calendar),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          headerShown: true,
          tabBarIcon: tabIcon(FileText),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          headerShown: true,
          tabBarIcon: tabIcon(HandCoins),
        }}
      />
      <Tabs.Screen
        name="secret-santa"
        options={{
          title: "Secret Santa",
          headerShown: true,
          tabBarIcon: tabIcon(Gift),
        }}
      />
    </Tabs>
  );
}
