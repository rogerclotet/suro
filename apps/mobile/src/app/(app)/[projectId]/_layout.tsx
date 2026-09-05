import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { ErrorBoundaryProps } from "expo-router";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import type {
  NativeTabsProps,
  NativeTabTriggerProps,
} from "expo-router/unstable-native-tabs";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { FC, PropsWithChildren } from "react";
import { Platform, View } from "react-native";
import { useTranslations } from "@/i18n";
import {
  type NotificationSection,
  notificationHref,
  unreadCount,
} from "@/lib/notification-routing";
import {
  useCaptureNotificationVisit,
  useUnreadNotifications,
} from "@/lib/notifications";
import { usePersistentQuery } from "@/lib/offline";
import { ProjectIdProvider } from "@/lib/project-id";
import { FONT, useTheme } from "@/theme";
import { Button, Loading, Screen, Txt } from "@/ui";

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
        <Txt size={18} display weight="700">
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

const Tabs = NativeTabs as unknown as FC<PropsWithChildren<NativeTabsProps>>;
const Trigger = NativeTabs.Trigger as unknown as FC<
  PropsWithChildren<NativeTabTriggerProps>
>;
const { Icon, Label, Badge } = NativeTabs.Trigger;

export default function ProjectTabs() {
  const t = useTheme();
  const tNav = useTranslations("nav");
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const projects = usePersistentQuery(api.projects.listMine);
  const liveProjects = useQuery(api.projects.listMine);
  const unread = useUnreadNotifications();
  const captureVisit = useCaptureNotificationVisit();
  const router = useRouter();
  function openUnread(section: NotificationSection) {
    const receipt = unread.find(
      (row) => row.projectId === projectId && row.section === section,
    );
    if (!receipt) return;
    captureVisit(receipt);
    // NativeTabs emits tabPress before its own JUMP_TO. Navigate after that
    // selection, using the captured receipt even if the root clears its badge.
    setTimeout(
      () => router.navigate(notificationHref(receipt), { withAnchor: true }),
      0,
    );
  }
  function badge(section: NotificationSection | "home") {
    const count = unreadCount(unread, projectId, section);
    return count
      ? String(Math.min(count, 99)) + (count > 99 ? "+" : "")
      : undefined;
  }

  if (!projectId) {
    return <Loading />;
  }

  // Wait for `listMine` before mounting native tabs. iOS release builds crash when
  // `NativeTabs` (a real UITabBarController) mounts and is torn down again during
  // startup redirects — e.g. a stale deep link or vanished membership — while iOS
  // is still configuring tab items (react-native-screens / iOS 26). Android uses a
  // separate bottom-nav path and isn't affected, but gating here is harmless.
  if (projects === undefined) {
    return <Loading />;
  }

  // Membership gone while we're on this route: redirect before project-scoped
  // queries mount and throw. Return to the groups list.
  if (!projects.some((p) => p._id === projectId)) {
    // A cached list can predate a newly created or joined group. Keep this
    // query mounted until the server confirms membership before redirecting.
    if (liveProjects === undefined) return <Loading />;
    return <Redirect href="/" />;
  }

  return (
    <ProjectIdProvider projectId={projectId as Id<"projects">}>
      <Tabs
        backBehavior="none"
        minimizeBehavior="onScrollDown"
        tintColor={t.primary}
        iconColor={{ default: t.muted, selected: t.primary }}
        labelStyle={{
          default: { fontFamily: FONT, color: t.muted },
          selected: { fontFamily: FONT, color: t.primary },
        }}
        indicatorColor={`${t.primary}33`}
        rippleColor={`${t.primary}33`}
        labelVisibilityMode="labeled"
        backgroundColor={Platform.OS === "android" ? t.navBar : undefined}
      >
        <Trigger name="home">
          <Label>{tNav("home")}</Label>
          <Badge hidden={badge("home") === undefined}>{badge("home")}</Badge>
          <Icon sf="house" md="home" />
        </Trigger>
        <Trigger
          name="lists"
          listeners={{ tabPress: () => openUnread("lists") }}
        >
          <Label>{tNav("lists")}</Label>
          <Badge hidden={badge("lists") === undefined}>{badge("lists")}</Badge>
          <Icon sf="checklist" md="checklist" />
        </Trigger>
        <Trigger
          name="calendar"
          listeners={{ tabPress: () => openUnread("calendar") }}
        >
          <Label>{tNav("calendar")}</Label>
          <Badge hidden={badge("calendar") === undefined}>
            {badge("calendar")}
          </Badge>
          <Icon sf="calendar" md="calendar_month" />
        </Trigger>
        <Trigger
          name="expenses"
          listeners={{ tabPress: () => openUnread("expenses") }}
        >
          <Label>{tNav("expenses")}</Label>
          <Badge hidden={badge("expenses") === undefined}>
            {badge("expenses")}
          </Badge>
          <Icon sf="creditcard" md="payments" />
        </Trigger>
      </Tabs>
    </ProjectIdProvider>
  );
}
