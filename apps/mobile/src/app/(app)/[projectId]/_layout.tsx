import type { Id } from "backend/convex/_generated/dataModel";
import { useLocalSearchParams } from "expo-router";
import type {
  NativeTabsProps,
  NativeTabTriggerProps,
} from "expo-router/unstable-native-tabs";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { FC, PropsWithChildren } from "react";
import { useEffect } from "react";
import { Platform } from "react-native";
import { setLastProjectId } from "@/lib/last-project";
import { ProjectIdProvider } from "@/lib/project-id";
import { FONT, useTheme } from "@/theme";
import { Loading, SheetHost } from "@/ui";

// `unstable-native-tabs`'s published types are off in two ways: `NativeTabs`
// and its `Trigger` are typed as `function & statics` (which TS won't treat as
// child-accepting components), and their prop interfaces dropped the
// `children` field from `PropsWithChildren`. Re-cast both to plain function
// components and add `children` back. The leaf `Icon`/`Label` are proper `FC`s
// and need no fix.
const Tabs = NativeTabs as unknown as FC<PropsWithChildren<NativeTabsProps>>;
const Trigger = NativeTabs.Trigger as unknown as FC<
  PropsWithChildren<NativeTabTriggerProps>
>;
const { Icon, Label } = NativeTabs.Trigger;

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

  // Native tab bar: on iOS this is a real UITabBar, so iOS 26 renders it as
  // Liquid Glass automatically — we deliberately set no `blurEffect` so the
  // system glass isn't overridden (earlier iOS falls back to a default blur).
  // On Android it's the Material 3 BottomNavigation, tinted below. Each section
  // is a folder route with its own nested Stack that owns the header (and the
  // iOS Liquid Glass badges), so headers are unaffected by this navigator.
  return (
    <ProjectIdProvider projectId={projectId as Id<"projects">}>
      <SheetHost>
        <Tabs
          minimizeBehavior="onScrollDown"
          tintColor={t.primary}
          iconColor={{ default: t.muted, selected: t.primary }}
          labelStyle={{
            default: { fontFamily: FONT, color: t.muted },
            selected: { fontFamily: FONT, color: t.primary },
          }}
          indicatorColor={t.primaryContainer}
          rippleColor={t.primaryContainer}
          // Android: always show every tab's label, and use the app's surface
          // color instead of the default M3 grey (which clashes with the warm
          // background). iOS is left untouched so the Liquid Glass shows through
          // — setting a backgroundColor there would replace the glass.
          labelVisibilityMode="labeled"
          backgroundColor={Platform.OS === "android" ? t.card : undefined}
        >
          <Trigger name="lists">
            <Label>Lists</Label>
            <Icon sf="checklist" md="checklist" />
          </Trigger>
          <Trigger name="calendar">
            <Label>Calendar</Label>
            <Icon sf="calendar" md="calendar_month" />
          </Trigger>
          <Trigger name="files">
            <Label>Files</Label>
            <Icon sf="folder" md="folder" />
          </Trigger>
          <Trigger name="notes">
            <Label>Notes</Label>
            <Icon sf="note.text" md="description" />
          </Trigger>
          <Trigger name="expenses">
            <Label>Expenses</Label>
            <Icon sf="creditcard" md="payments" />
          </Trigger>
        </Tabs>
      </SheetHost>
    </ProjectIdProvider>
  );
}
