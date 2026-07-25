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
import { useGroupTabLabel } from "@/components/group-tab-trigger";
import { useTranslations } from "@/i18n";
import { FeedbackProvider } from "@/lib/feedback-state";
import { setLastProjectId } from "@/lib/last-project";
import { usePersistentQuery } from "@/lib/offline";
import { ProjectIdProvider } from "@/lib/project-id";
import { FONT, useTheme } from "@/theme";
import { Button, Loading, Screen, SheetHost, Txt } from "@/ui";

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
const { Icon, Label } = NativeTabs.Trigger;

export default function ProjectTabs() {
  const t = useTheme();
  const tNav = useTranslations("nav");
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const projects = usePersistentQuery(api.projects.listMine);
  const groupTabLabel = useGroupTabLabel();

  useEffect(() => {
    if (projectId) {
      void setLastProjectId(projectId);
    }
  }, [projectId]);

  if (!projectId) {
    return <Loading />;
  }

  if (projects !== undefined && !projects.some((p) => p._id === projectId)) {
    return <Redirect href="/" />;
  }

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
            indicatorColor={`${t.primary}33`}
            rippleColor={`${t.primary}33`}
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
            <Trigger name="groups">
              <Label>{groupTabLabel}</Label>
              <Icon sf="person.2" md="group" />
            </Trigger>
          </Tabs>
        </FeedbackProvider>
      </SheetHost>
    </ProjectIdProvider>
  );
}
