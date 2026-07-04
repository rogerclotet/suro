import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import type { ErrorBoundaryProps } from "expo-router";
import { Redirect, useLocalSearchParams } from "expo-router";
import type {
  NativeTabsProps,
  NativeTabTriggerProps,
} from "expo-router/unstable-native-tabs";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { FC, PropsWithChildren } from "react";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { useTranslations } from "@/i18n";
import { FeedbackProvider } from "@/lib/feedback-state";
import { setLastProjectId } from "@/lib/last-project";
import { usePersistentQuery } from "@/lib/offline";
import { ProjectIdProvider } from "@/lib/project-id";
import { FONT, useTheme } from "@/theme";
import { Button, Loading, Screen, SheetHost, Txt } from "@/ui";

// Opaque "…not found" errors the project-scoped queries throw when the group, or
// our membership in it, disappears while we're viewing it: the creator deleted
// the group, we were removed, or we deleted our own account.
const VANISHED_RESOURCE_ERRORS = new Set([
  "Project not found",
  "List not found",
  "List item not found",
  "Event not found",
  "Note not found",
  "Pot not found",
  "Template not found",
  "File not found",
]);

// Catches errors from this group's screens. When the group vanished underneath
// us, bounce to the index route — it resumes a remaining group, offers group
// creation, or (once signed out) sends us to login — instead of surfacing a
// fatal "Project not found". Any other error falls through to a retryable
// message rather than redirecting, which could loop back into the same screen.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const tc = useTranslations("common");
  if (VANISHED_RESOURCE_ERRORS.has(error.message)) {
    return <Redirect href="/" />;
  }
  return (
    <Screen>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
        }}
      >
        <Txt size={18} weight="700">
          {tc("error")}
        </Txt>
        <Txt muted style={{ textAlign: "center" }}>
          {error.message}
        </Txt>
        <Button title={tc("tryAgain")} onPress={() => void retry()} />
      </View>
    </Screen>
  );
}

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
  const tNav = useTranslations("nav");
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const projects = usePersistentQuery(api.projects.listMine);

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

  // When our membership in this group goes away while we're inside it (the
  // creator deleted it, we were removed, or we deleted our account), Convex's
  // consistent snapshot drops it from `listMine` in the *same* update that makes
  // the project-scoped queries below throw "Project not found". Redirect before
  // rendering the tabs so those queries never mount and throw — the index route
  // then resumes a remaining group, offers creation, or routes to login once
  // signed out. `undefined` means still loading, so render optimistically and
  // avoid a flash on normal entry.
  if (projects !== undefined && !projects.some((p) => p._id === projectId)) {
    return <Redirect href="/" />;
  }

  // Native tab bar: a content-first Home, the high-traffic sections (lists,
  // calendar, expenses), and a "More" tab holding the overflow sections — so the
  // bar stays at five however many sections we add. On iOS this is a real
  // UITabBar (Liquid Glass on iOS 26, no `blurEffect` override); on Android it's
  // the Material 3 BottomNavigation, tinted below. Each tab is a folder route
  // with its own nested Stack that owns the header (and the iOS Liquid Glass
  // badges), so headers are unaffected by this navigator.
  return (
    <ProjectIdProvider projectId={projectId as Id<"projects">}>
      <SheetHost>
        <FeedbackProvider>
          <Tabs
            minimizeBehavior="onScrollDown"
            tintColor={t.primary}
            iconColor={{ default: t.muted, selected: t.primary }}
            labelStyle={{
              default: { fontFamily: FONT, color: t.muted },
              selected: { fontFamily: FONT, color: t.primary },
            }}
            // Active-item pill: the web app's soft translucent green
            // (`bg-primary/20`), not M3's opaque tonal container — `33` ≈ 20% alpha.
            indicatorColor={`${t.primary}33`}
            rippleColor={`${t.primary}33`}
            // Android: always show every tab's label, and paint the surface with
            // a warm M3 `surfaceContainer` tone (`t.navBar`) so the bar reads as a
            // slightly elevated surface above the page background, per M3, while
            // still avoiding the default M3 grey that clashes with our warm bg.
            // iOS is left untouched so the Liquid Glass shows through — setting a
            // backgroundColor there would replace the glass.
            labelVisibilityMode="labeled"
            backgroundColor={Platform.OS === "android" ? t.navBar : undefined}
          >
            <Trigger name="home">
              <Label>{tNav("home")}</Label>
              <Icon sf="house" md="home" />
            </Trigger>
            <Trigger name="lists">
              <Label>{tNav("lists")}</Label>
              <Icon sf="checklist" md="checklist" />
            </Trigger>
            <Trigger name="calendar">
              <Label>{tNav("calendar")}</Label>
              <Icon sf="calendar" md="calendar_month" />
            </Trigger>
            <Trigger name="expenses">
              <Label>{tNav("expenses")}</Label>
              <Icon sf="creditcard" md="payments" />
            </Trigger>
            <Trigger name="more">
              <Label>{tNav("more")}</Label>
              <Icon sf="ellipsis" md="more_horiz" />
            </Trigger>
          </Tabs>
        </FeedbackProvider>
      </SheetHost>
    </ProjectIdProvider>
  );
}
