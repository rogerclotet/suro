import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useTheme } from "@/theme";
import { Button, Txt } from "@/ui";

type Project = FunctionReturnType<typeof api.projects.listMine>[number];

/**
 * The "export this template to another group" sub-view shared by the templates
 * index actions sheet and the template editor's settings sheet. Rendered inline
 * inside a `Sheet` (toggled by the host's local `showExport`) rather than as its
 * own Modal, so it never stacks two Modals — presenting a second one while the
 * first is still mounted is silently dropped on iOS. Picking a group copies the
 * template there and reports the target's name back via `onExported`.
 */
export function ExportTargetPicker({
  templateId,
  currentProjectId,
  onExported,
  onBack,
}: {
  templateId: Id<"listTemplates">;
  currentProjectId: Id<"projects">;
  onExported: (projectName: string) => void;
  onBack: () => void;
}) {
  const projects = usePersistentQuery(api.projects.listMine);
  const exportToProject = useMutation(api.templates.exportToProject);
  const t = useTheme();
  const tr = useTranslations("mobile.templates");
  const tc = useTranslations("mobile.common");

  const otherProjects = (projects ?? []).filter(
    (project) => project._id !== currentProjectId,
  );

  async function doExport(target: Project) {
    await exportToProject({ templateId, targetProjectId: target._id });
    onExported(target.name);
  }

  return (
    <>
      <Txt muted size={13}>
        {tr("exportToGroup")}
      </Txt>
      {otherProjects.length === 0 ? (
        <Txt muted style={{ paddingVertical: 8 }}>
          {tr("noOtherGroups")}
        </Txt>
      ) : (
        <ScrollView style={{ maxHeight: 260 }}>
          <View style={{ gap: 8 }}>
            {otherProjects.map((project) => (
              <Pressable
                key={project._id}
                onPress={() => void doExport(project)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: pressed ? t.border : t.inputBg,
                })}
              >
                <Txt size={15} style={{ flex: 1 }}>
                  {project.name}
                </Txt>
                <ChevronRight color={t.muted} size={18} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
      <Button title={tc("back")} variant="ghost" onPress={onBack} />
    </>
  );
}
