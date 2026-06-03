import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { useTheme } from "@/theme";
import { Button, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

type Template = FunctionReturnType<typeof api.templates.listByProject>[number];
type Project = FunctionReturnType<typeof api.projects.listMine>[number];

export default function Templates() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const pid = projectId as Id<"projects">;
  const templates = useQuery(api.templates.listByProject, { projectId: pid });
  const router = useRouter();
  const t = useTheme();

  const [creating, setCreating] = useState(false);
  // Visibility is separate from the content so the sheet keeps showing the
  // template while it slides out (matches the other sheets in the app).
  const [actionsVisible, setActionsVisible] = useState(false);
  const [actionsTemplate, setActionsTemplate] = useState<Template | null>(null);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Templates" }} />
      {templates === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(template) => template._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 12 }}
          ListEmptyComponent={
            <Txt muted style={{ padding: 8 }}>
              No templates yet. Tap + to create one.
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
                    {item.items.length} item{item.items.length === 1 ? "" : "s"}
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
        New template
      </Txt>
      <Field placeholder="Name" value={name} onChangeText={setName} autoFocus />
      <Field
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />
      <Button
        title={busy ? "Creating…" : "Create template"}
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
      "Delete template",
      `Delete "${target.name}"? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
    Alert.alert("Template exported", `Copied to "${target.name}".`);
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
            Export to another group
          </Txt>
          {otherProjects.length === 0 ? (
            <Txt muted style={{ paddingVertical: 8 }}>
              You have no other groups.
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
            title="Back"
            variant="ghost"
            onPress={() => setShowExport(false)}
          />
        </>
      ) : (
        <>
          <Button
            title="Create list from template"
            onPress={createListFromTemplate}
          />
          <Button
            title="Export to another group"
            variant="ghost"
            onPress={() => setShowExport(true)}
          />
          <Pressable onPress={confirmDelete} style={{ padding: 10 }}>
            <Txt style={{ textAlign: "center", color: "#e64553" }}>
              Delete template
            </Txt>
          </Pressable>
        </>
      )}
    </Sheet>
  );
}
