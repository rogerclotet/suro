import type { Id } from "backend/convex/_generated/dataModel";
import { Tabs, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  FileText,
  FolderOpen,
  Gift,
  HandCoins,
  ListTodo,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect } from "react";
import type { ColorValue } from "react-native";
import { setLastProjectId } from "@/lib/last-project";
import { ProjectIdProvider } from "@/lib/project-id";
import { FONT, useTheme } from "@/theme";
import { Loading } from "@/ui";

// Monochrome lucide icons, matching the PWA's section iconography.
const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Icon color={color as string} size={size} />
  );

export default function ProjectTabs() {
  const t = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  // Remember this group so the next launch resumes here.
  useEffect(() => {
    if (projectId) {
      void setLastProjectId(projectId);
    }
  }, [projectId]);

  // This route can't match without a concrete projectId, but guard the brief
  // pre-hydration tick so descendants never read an undefined id.
  if (!projectId) {
    return <Loading />;
  }

  return (
    <ProjectIdProvider projectId={projectId as Id<"projects">}>
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
          options={{ title: "Calendar", tabBarIcon: tabIcon(Calendar) }}
        />
        <Tabs.Screen
          name="files"
          options={{
            title: "Files",
            headerShown: true,
            tabBarIcon: tabIcon(FolderOpen),
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
    </ProjectIdProvider>
  );
}
