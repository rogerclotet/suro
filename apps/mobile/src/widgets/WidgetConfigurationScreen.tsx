import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvex } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";
import { Avatar } from "@/components/avatar";
import { useLocale, useTranslations } from "@/i18n";
import { normalizeLocale } from "@/i18n/config";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";
import { useTheme } from "@/theme";
import { Button, Loading, Txt } from "@/ui";
import { buildWidgetSnapshot, widgetEventBounds } from "./build-snapshot";
import { getWidgetProjectId, setWidgetProjectId } from "./config";
import { renderHomeWidget } from "./HomeWidget";
import { persistProjectSnapshot, refreshAllWidgets } from "./sync";

type Project = FunctionReturnType<typeof api.projects.listMine>[number];

/**
 * Android widget configuration activity: pick which group this instance shows.
 * Each home-screen widget can bind to a different project.
 */
export function WidgetConfigurationScreen({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const t = useTheme();
  const locale = normalizeLocale(useLocale());
  const tw = useTranslations("mobile.widget");
  const { isAuthenticated } = useAuthGate();
  const projects = usePersistentQuery(
    api.projects.listMine,
    isAuthenticated ? {} : "skip",
  );
  const convex = useConvex();
  const bounds = widgetEventBounds();

  const initial = getWidgetProjectId(widgetInfo.widgetId);
  const [selected, setSelected] = useState<Id<"projects"> | null>(
    initial ? (initial as Id<"projects">) : null,
  );
  const [saving, setSaving] = useState(false);

  const preview = useCallback(
    async (projectId: Id<"projects">, projectName: string) => {
      const [events, tasks] = await Promise.all([
        convex.query(api.events.listByRange, {
          projectId,
          from: bounds.from,
          to: bounds.to,
        }),
        convex.query(api.tasks.myTasks, { projectId }),
      ]);
      const snapshot = buildWidgetSnapshot({
        locale,
        signedIn: true,
        projectId,
        projectName,
        events,
        tasks,
      });
      renderWidget(renderHomeWidget(snapshot));
    },
    [bounds.from, bounds.to, convex, locale, renderWidget],
  );

  useEffect(() => {
    if (!selected || !projects) {
      return;
    }
    const project = projects.find((entry) => entry._id === selected);
    if (project) {
      void preview(selected, project.name);
    }
  }, [selected, projects, preview]);

  async function save() {
    if (!selected || !projects) {
      return;
    }
    const project = projects.find((entry) => entry._id === selected);
    if (!project) {
      return;
    }
    setSaving(true);
    try {
      setWidgetProjectId(widgetInfo.widgetId, selected);
      const [events, tasks] = await Promise.all([
        convex.query(api.events.listByRange, {
          projectId: selected,
          from: bounds.from,
          to: bounds.to,
        }),
        convex.query(api.tasks.myTasks, { projectId: selected }),
      ]);
      const snapshot = buildWidgetSnapshot({
        locale,
        signedIn: true,
        projectId: selected,
        projectName: project.name,
        events,
        tasks,
      });
      persistProjectSnapshot(selected, snapshot);
      renderWidget(renderHomeWidget(snapshot));
      await refreshAllWidgets(locale);
      setResult("ok");
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          backgroundColor: t.bg,
        }}
      >
        <Txt style={{ textAlign: "center" }} muted>
          {tw("signInToConfigure")}
        </Txt>
        <Button title={tw("cancel")} onPress={() => setResult("cancel")} />
      </View>
    );
  }

  if (projects === undefined) {
    return <Loading />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Txt
        size={18}
        weight="700"
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}
      >
        {tw("chooseGroup")}
      </Txt>
      <Txt muted size={13} style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        {tw("chooseGroupHint")}
      </Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {projects.map((project) => (
          <GroupRow
            key={project._id}
            project={project}
            active={selected === project._id}
            onPress={() => setSelected(project._id)}
          />
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: t.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button title={tw("cancel")} onPress={() => setResult("cancel")} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title={tw("save")}
            onPress={() => void save()}
            disabled={!selected || saving}
          />
        </View>
      </View>
    </View>
  );
}

function GroupRow({
  project,
  active,
  onPress,
}: {
  project: Project;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: active ? `${t.primary}22` : t.card,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Avatar
        name={project.name}
        image={project.image}
        color={project.color}
        size={36}
      />
      <Txt weight="700" style={{ flex: 1 }} numberOfLines={1}>
        {project.name}
      </Txt>
      {active ? <Check color={t.primary} size={20} /> : null}
    </Pressable>
  );
}
