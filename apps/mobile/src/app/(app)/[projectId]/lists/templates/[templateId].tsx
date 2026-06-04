import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, View } from "react-native";
import { CategoryPicker } from "@/components/category-picker";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Field, Loading, Screen, Sheet, Txt } from "@/ui";

type Template = FunctionReturnType<typeof api.templates.get>;
type TemplateItem = Template["items"][number];
type Category = FunctionReturnType<typeof api.categories.listByProject>[number];
/** A template item plus its position in the template's `items` array. */
type IndexedItem = TemplateItem & { index: number };

const UNCATEGORIZED = "Other";

/** Group items by their category name, sorted like the PWA (category & item alpha). */
function groupByCategory(items: TemplateItem[], categories: Category[]) {
  const nameById = new Map(categories.map((c) => [c._id, c.name]));
  const groups = new Map<string, IndexedItem[]>();
  items.forEach((item, index) => {
    const key =
      (item.category && nameById.get(item.category as Id<"categories">)) ??
      UNCATEGORIZED;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push({ ...item, index });
    } else {
      groups.set(key, [{ ...item, index }]);
    }
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({
      title,
      data: data.sort((x, y) => x.name.localeCompare(y.name)),
    }));
}

export default function TemplateEditor() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const pid = useProjectId();
  const tid = templateId as Id<"listTemplates">;
  const t = useTheme();
  const router = useRouter();

  const template = useQuery(api.templates.get, { templateId: tid });
  const categories = useQuery(api.categories.listByProject, { projectId: pid });
  const update = useMutation(api.templates.update);
  const remove = useMutation(api.templates.remove);
  const createCategory = useMutation(api.categories.create);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Id<"categories"> | null>(null);
  // Edit state is lifted to the parent (persists through the sheet's slide-out).
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<Id<"categories"> | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");

  const sections = useMemo(
    () => (template ? groupByCategory(template.items, categories ?? []) : []),
    [template, categories],
  );

  async function persist(
    items: TemplateItem[],
    name?: string,
    description?: string,
  ) {
    if (!template) {
      return;
    }
    await update({
      templateId: tid,
      name: (name ?? template.name).trim() || template.name,
      description: description ?? template.description,
      items,
    });
  }

  async function onCreateCategory(name: string) {
    return createCategory({ projectId: pid, name });
  }

  async function addItem() {
    const trimmed = newName.trim();
    if (!trimmed || !template) {
      return;
    }
    setNewName("");
    const category = newCategory;
    await persist([...template.items, { name: trimmed, category }]);
  }

  function openEdit(item: IndexedItem) {
    setEditingIndex(item.index);
    setEditName(item.name);
    setEditCategory((item.category as Id<"categories"> | null) ?? null);
  }

  async function saveEdit() {
    if (editingIndex === null || !template) {
      return;
    }
    const index = editingIndex;
    const trimmed = editName.trim();
    setEditingIndex(null);
    if (!trimmed) {
      return;
    }
    const items = template.items.map((item, i) =>
      i === index ? { name: trimmed, category: editCategory } : item,
    );
    await persist(items);
  }

  async function deleteEditingItem() {
    if (editingIndex === null || !template) {
      return;
    }
    const index = editingIndex;
    setEditingIndex(null);
    await persist(template.items.filter((_, i) => i !== index));
  }

  function openSettings() {
    if (!template) {
      return;
    }
    setSettingsName(template.name);
    setSettingsDescription(template.description ?? "");
    setSettingsOpen(true);
  }

  async function saveSettings() {
    setSettingsOpen(false);
    if (!template) {
      return;
    }
    await persist(template.items, settingsName, settingsDescription.trim());
  }

  async function deleteTemplate() {
    setSettingsOpen(false);
    await remove({ templateId: tid });
    router.back();
  }

  if (template === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: template.name,
          headerRight: () => (
            <Pressable onPress={openSettings} hitSlop={8}>
              <Txt size={20} style={{ color: t.primary }}>
                ⋯
              </Txt>
            </Pressable>
          ),
        }}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.index)}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 8, paddingBottom: 12 }}>
            {template.description ? (
              <Txt muted style={{ paddingBottom: 4 }}>
                {template.description}
              </Txt>
            ) : null}
            <Field
              placeholder="Add an item…"
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
            >
              <View style={{ flex: 1 }}>
                <CategoryPicker
                  categories={categories ?? []}
                  value={newCategory}
                  onChange={setNewCategory}
                  onCreate={onCreateCategory}
                />
              </View>
              <Button title="Add" onPress={addItem} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Txt muted style={{ padding: 16 }}>
            No items yet.
          </Txt>
        }
        renderSectionHeader={({ section }) =>
          sections.length > 1 ? (
            <Txt
              muted
              size={12}
              style={{ paddingTop: 16, paddingBottom: 4, letterSpacing: 1 }}
            >
              {section.title.toUpperCase()}
            </Txt>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: t.border,
            }}
          >
            <Txt size={16}>{item.name}</Txt>
          </Pressable>
        )}
      />

      <EditTemplateItemSheet
        visible={editingIndex !== null}
        name={editName}
        category={editCategory}
        categories={categories ?? []}
        onChangeName={setEditName}
        onChangeCategory={setEditCategory}
        onCreateCategory={onCreateCategory}
        onSave={saveEdit}
        onDelete={deleteEditingItem}
        onClose={() => setEditingIndex(null)}
      />

      <Sheet visible={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <Txt size={18} weight="700">
          Template settings
        </Txt>
        <Field
          placeholder="Name"
          value={settingsName}
          onChangeText={setSettingsName}
        />
        <Field
          placeholder="Description (optional)"
          value={settingsDescription}
          onChangeText={setSettingsDescription}
        />
        <Button title="Save" onPress={saveSettings} />
        <Pressable onPress={deleteTemplate} style={{ padding: 10 }}>
          <Txt style={{ textAlign: "center", color: "#e64553" }}>
            Delete template
          </Txt>
        </Pressable>
      </Sheet>
    </Screen>
  );
}

function EditTemplateItemSheet({
  visible,
  name,
  category,
  categories,
  onChangeName,
  onChangeCategory,
  onCreateCategory,
  onSave,
  onDelete,
  onClose,
}: {
  visible: boolean;
  name: string;
  category: Id<"categories"> | null;
  categories: Category[];
  onChangeName: (value: string) => void;
  onChangeCategory: (value: Id<"categories"> | null) => void;
  onCreateCategory: (name: string) => Promise<Id<"categories">>;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        Edit item
      </Txt>
      <Field placeholder="Name" value={name} onChangeText={onChangeName} />
      <CategoryPicker
        categories={categories}
        value={category}
        onChange={onChangeCategory}
        onCreate={onCreateCategory}
      />
      <Button title="Save" onPress={onSave} />
      <Pressable onPress={onDelete} style={{ padding: 10 }}>
        <Txt style={{ textAlign: "center", color: "#e64553" }}>Delete item</Txt>
      </Pressable>
    </Sheet>
  );
}
