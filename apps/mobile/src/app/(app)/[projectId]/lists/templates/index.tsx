import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

type Template = FunctionReturnType<typeof api.templates.listByProject>[number];
type Project = FunctionReturnType<typeof api.projects.listMine>[number];

export default function Templates() {
  const pid = useProjectId();
  const templates = useQuery(api.templates.listByProject, { projectId: pid });
  const router = useRouter();
  const t = useTheme();
  const tr = useTranslations("mobile.templates");

  const [creating, setCreating] = useState(false);
  // Visibility is separate from the content so the sheet keeps showing the
  // template while it slides out (matches the other sheets in the app).
  const [actionsVisible, setActionsVisible] = useState(false);
  const [actionsTemplate, setActionsTemplate] = useState<Template | null>(null);

  return (
    <Screen>
      <Stack.Screen options={{ title: tr("title") }} />
      {templates === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(template) => template._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 12 }}
          ListEmptyComponent={
            <Txt muted style={{ padding: 8 }}>
              {tr("empty")}
            </Txt>
          }
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Pressable
                style={{ flex: 1 }}
                onPress={() =>
                  router.push(`/${pid}/lists/templates/${item._id}`)
                }
              >
                <View
                  style={{
                    backgroundColor: t.card,
                    borderColor: t.border,
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <Txt size={17} weight="700">
                    {item.name}
                  </Txt>
                  {item.description ? (
                    <Txt muted size={13} numberOfLines={2}>
                      {item.description}
                    </Txt>
                  ) : null}
                  <Txt muted size={13}>
                    {tr("itemCount", { count: item.items.length })}
                  </Txt>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  setActionsTemplate(item);
                  setActionsVisible(true);
                }}
                hitSlop={10}
                style={{ padding: 6 }}
              >
                <Txt size={22} style={{ color: t.primary }}>
                  ⋯
                </Txt>
              </Pressable>
            </View>
          )}
        />
      )}

      {!creating && !actionsVisible && (
        <Fab onPress={() => setCreating(true)} />
      )}
      <CreateTemplateSheet
        visible={creating}
        projectId={pid}
        onClose={() => setCreating(false)}
      />
      <TemplateActionsSheet
        visible={actionsVisible}
        template={actionsTemplate}
        projectId={pid}
        onClose={() => setActionsVisible(false)}
      />
    </Screen>
  );
}

function CreateTemplateSheet({
  visible,
  projectId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  onClose: () => void;
}) {
  const create = useMutation(api.templates.create);
  const router = useRouter();
  const t = useTranslations("mobile.templates");
  const tc = useTranslations("mobile.common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setBusy(true);
    try {
      const templateId = await create({
        projectId,
        name: trimmed,
        description: description.trim() || undefined,
        items: [],
      });
      setName("");
      setDescription("");
      onClose();
      router.push(`/${projectId}/lists/templates/${templateId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {t("newTemplate")}
      </Txt>
      <Field
        placeholder={t("namePlaceholder")}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Field
        placeholder={t("descriptionPlaceholder")}
        value={description}
        onChangeText={setDescription}
      />
      <Button
        title={busy ? tc("creating") : t("createTemplate")}
        disabled={busy || name.trim().length === 0}
        onPress={submit}
      />
    </Sheet>
  );
}

function TemplateActionsSheet({
  visible,
  template,
  projectId,
  onClose,
}: {
  visible: boolean;
  template: Template | null;
  projectId: Id<"projects">;
  onClose: () => void;
}) {
  const projects = useQuery(api.projects.listMine);
  const createList = useMutation(api.lists.create);
  const exportToProject = useMutation(api.templates.exportToProject);
  const remove = useMutation(api.templates.remove);
  const router = useRouter();
  const t = useTranslations("mobile.templates");
  const tc = useTranslations("mobile.common");
  const [showExport, setShowExport] = useState(false);

  const otherProjects = (projects ?? []).filter((p) => p._id !== projectId);

  async function createListFromTemplate() {
    if (!template) {
      return;
    }
    const listId = await createList({
      projectId,
      name: template.name,
      templateIds: [template._id],
    });
    onClose();
    router.push(`/${projectId}/lists/${listId}`);
  }

  function confirmDelete() {
    if (!template) {
      return;
    }
    const target = template;
    Alert.alert(
      t("deleteTemplate"),
      t("deleteMessage", { name: target.name }),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => {
            onClose();
            void remove({ templateId: target._id });
          },
        },
      ],
    );
  }

  async function doExport(target: Project) {
    if (!template) {
      return;
    }
    await exportToProject({
      templateId: template._id,
      targetProjectId: target._id,
    });
    setShowExport(false);
    onClose();
    Alert.alert(
      t("exportedTitle"),
      t("exportedMessage", { name: target.name }),
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        setShowExport(false);
        onClose();
      }}
    >
      <Txt size={18} weight="700">
        {template?.name ?? ""}
      </Txt>
      {showExport ? (
        <>
          <Txt muted size={13}>
            {t("exportToGroup")}
          </Txt>
          {otherProjects.length === 0 ? (
            <Txt muted style={{ paddingVertical: 8 }}>
              {t("noOtherGroups")}
            </Txt>
          ) : (
            otherProjects.map((project) => (
              <Button
                key={project._id}
                title={project.name}
                variant="ghost"
                onPress={() => void doExport(project)}
              />
            ))
          )}
          <Button
            title={tc("back")}
            variant="ghost"
            onPress={() => setShowExport(false)}
          />
        </>
      ) : (
        <>
          <Button
            title={t("createListFromTemplate")}
            onPress={createListFromTemplate}
          />
          <Button
            title={t("exportToGroup")}
            variant="ghost"
            onPress={() => setShowExport(true)}
          />
          <Pressable onPress={confirmDelete} style={{ padding: 10 }}>
            <Txt style={{ textAlign: "center", color: "#e64553" }}>
              {t("deleteTemplate")}
            </Txt>
          </Pressable>
        </>
      )}
    </Sheet>
  );
}
