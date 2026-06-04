import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, Switch, View } from "react-native";
import { CategoryPicker } from "@/components/category-picker";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Field,
  HEADER_BUTTON_INSET,
  Loading,
  Screen,
  Sheet,
  Txt,
} from "@/ui";

type ListResult = FunctionReturnType<typeof api.lists.get>;
type Item = ListResult["items"][number];
type Category = FunctionReturnType<typeof api.categories.listByProject>[number];

const UNCATEGORIZED = "Other";

function groupByCategory(items: Item[]) {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.category?.name ?? UNCATEGORIZED;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

export default function ListDetail() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const pid = useProjectId();
  const lid = listId as Id<"lists">;
  const t = useTheme();
  const router = useRouter();

  const list = useQuery(api.lists.get, { listId: lid });
  const categories = useQuery(api.categories.listByProject, { projectId: pid });
  const createItem = useMutation(api.listItems.create);
  const removeItem = useMutation(api.listItems.remove);
  const createCategory = useMutation(api.categories.create);
  const toggleFavorite = useMutation(api.lists.toggleFavorite);
  const updateList = useMutation(api.lists.update);
  const removeList = useMutation(api.lists.remove);
  const clearCompleted = useMutation(api.lists.clearCompleted);
  const updateItem = useMutation(api.listItems.update).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.lists.get, { listId: lid });
      if (!current) {
        return;
      }
      store.setQuery(
        api.lists.get,
        { listId: lid },
        {
          ...current,
          items: current.items.map((item) =>
            item._id === args.itemId
              ? { ...item, completed: args.completed }
              : item,
          ),
        },
      );
    },
  );

  const [name, setName] = useState("");
  const [addCategory, setAddCategory] = useState<Id<"categories"> | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editCategory, setEditCategory] = useState<Id<"categories"> | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  const sections = useMemo(
    () => (list ? groupByCategory(list.items) : []),
    [list],
  );

  async function onCreateCategory(categoryName: string) {
    return createCategory({ projectId: pid, name: categoryName });
  }

  async function addItem() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setName("");
    // Keep the chosen category so adding several items to it stays quick.
    await createItem({ listId: lid, name: trimmed, categoryId: addCategory });
  }

  function toggle(item: Item) {
    void updateItem({
      itemId: item._id,
      name: item.name,
      details: item.details ?? "",
      completed: !item.completed,
      categoryId: item.categoryId ?? null,
    });
  }

  function openEdit(item: Item) {
    setEditing(item);
    setEditName(item.name);
    setEditDetails(item.details ?? "");
    setEditCategory(item.categoryId ?? null);
  }

  async function saveEdit() {
    if (!editing) {
      return;
    }
    const target = editing;
    setEditing(null);
    await updateItem({
      itemId: target._id,
      name: editName.trim() || target.name,
      details: editDetails,
      completed: target.completed,
      categoryId: editCategory,
    });
  }

  async function deleteEditingItem() {
    if (!editing) {
      return;
    }
    const target = editing;
    setEditing(null);
    await removeItem({ itemId: target._id });
  }

  function openSettings() {
    if (!list) {
      return;
    }
    setListName(list.name);
    setListDescription(list.description ?? "");
    setSettingsOpen(true);
  }

  async function saveSettings() {
    setSettingsOpen(false);
    await updateList({
      listId: lid,
      name: listName.trim() || (list?.name ?? ""),
      description: listDescription,
    });
  }

  async function handleDeleteList() {
    setSettingsOpen(false);
    await removeList({ listId: lid });
    router.back();
  }

  if (list === undefined) {
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
          title: list.name,
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                gap: 14,
                paddingRight: HEADER_BUTTON_INSET,
              }}
            >
              <Pressable
                onPress={() => void toggleFavorite({ listId: lid })}
                hitSlop={8}
              >
                <Txt size={20} style={{ color: t.primary }}>
                  {list.favorite ? "★" : "☆"}
                </Txt>
              </Pressable>
              <Pressable onPress={openSettings} hitSlop={8}>
                <Txt size={20} style={{ color: t.primary }}>
                  ⋯
                </Txt>
              </Pressable>
            </View>
          ),
        }}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 8, paddingBottom: 12 }}>
            <Field
              placeholder="Add an item…"
              value={name}
              onChangeText={setName}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
            >
              <View style={{ flex: 1 }}>
                <CategoryPicker
                  categories={categories ?? []}
                  value={addCategory}
                  onChange={setAddCategory}
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderColor: t.border,
            }}
          >
            <Pressable
              onPress={() => toggle(item)}
              hitSlop={8}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 2,
                borderColor: item.completed ? t.primary : t.muted,
                backgroundColor: item.completed ? t.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.completed ? (
                <Txt size={15} style={{ color: t.onPrimary }}>
                  ✓
                </Txt>
              ) : null}
            </Pressable>
            <Pressable style={{ flex: 1 }} onPress={() => openEdit(item)}>
              <Txt size={16} muted={item.completed} strike={item.completed}>
                {item.name}
              </Txt>
              {item.details ? (
                <Txt muted size={13}>
                  {item.details}
                </Txt>
              ) : null}
            </Pressable>
          </View>
        )}
      />

      <EditItemSheet
        visible={editing !== null}
        name={editName}
        details={editDetails}
        categoryId={editCategory}
        categories={categories ?? []}
        onChangeName={setEditName}
        onChangeDetails={setEditDetails}
        onChangeCategory={setEditCategory}
        onCreateCategory={onCreateCategory}
        onSave={saveEdit}
        onDelete={deleteEditingItem}
        onClose={() => setEditing(null)}
      />

      <SettingsSheet
        visible={settingsOpen}
        name={listName}
        description={listDescription}
        onChangeName={setListName}
        onChangeDescription={setListDescription}
        onSave={saveSettings}
        onImportTemplates={() => {
          setSettingsOpen(false);
          setImportOpen(true);
        }}
        onClearCompleted={async () => {
          setSettingsOpen(false);
          await clearCompleted({ listId: lid });
        }}
        onDelete={handleDeleteList}
        onClose={() => setSettingsOpen(false)}
      />

      <ImportTemplatesSheet
        visible={importOpen}
        projectId={pid}
        listId={lid}
        onClose={() => setImportOpen(false)}
      />
    </Screen>
  );
}

function EditItemSheet({
  visible,
  name,
  details,
  categoryId,
  categories,
  onChangeName,
  onChangeDetails,
  onChangeCategory,
  onCreateCategory,
  onSave,
  onDelete,
  onClose,
}: {
  visible: boolean;
  name: string;
  details: string;
  categoryId: Id<"categories"> | null;
  categories: Category[];
  onChangeName: (value: string) => void;
  onChangeDetails: (value: string) => void;
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
      <Field
        placeholder="Details (optional)"
        value={details}
        onChangeText={onChangeDetails}
      />
      <CategoryPicker
        categories={categories}
        value={categoryId}
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

function SettingsSheet({
  visible,
  name,
  description,
  onChangeName,
  onChangeDescription,
  onSave,
  onImportTemplates,
  onClearCompleted,
  onDelete,
  onClose,
}: {
  visible: boolean;
  name: string;
  description: string;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onSave: () => void;
  onImportTemplates: () => void;
  onClearCompleted: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        List settings
      </Txt>
      <Field placeholder="Name" value={name} onChangeText={onChangeName} />
      <Field
        placeholder="Description (optional)"
        value={description}
        onChangeText={onChangeDescription}
      />
      <Button title="Save" onPress={onSave} />
      <Button
        title="Import templates"
        variant="ghost"
        onPress={onImportTemplates}
      />
      <Button
        title="Clear completed items"
        variant="ghost"
        onPress={onClearCompleted}
      />
      <Pressable onPress={onDelete} style={{ padding: 10 }}>
        <Txt style={{ textAlign: "center", color: "#e64553" }}>Delete list</Txt>
      </Pressable>
    </Sheet>
  );
}

function ImportTemplatesSheet({
  visible,
  projectId,
  listId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  listId: Id<"lists">;
  onClose: () => void;
}) {
  const templates = useQuery(api.templates.listByProject, { projectId });
  const importTemplates = useMutation(api.lists.importTemplates);
  const t = useTheme();
  const [selected, setSelected] = useState<Id<"listTemplates">[]>([]);
  const [busy, setBusy] = useState(false);

  function toggle(id: Id<"listTemplates">) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submit() {
    if (selected.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await importTemplates({ listId, templateIds: selected });
      setSelected([]);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        setSelected([]);
        onClose();
      }}
    >
      <Txt size={18} weight="700">
        Import templates
      </Txt>
      {templates && templates.length > 0 ? (
        <ScrollView style={{ maxHeight: 260 }}>
          {templates.map((template) => (
            <View
              key={template._id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 6,
              }}
            >
              <Switch
                value={selected.includes(template._id)}
                onValueChange={() => toggle(template._id)}
                trackColor={{ true: t.primary, false: t.border }}
              />
              <Txt style={{ flex: 1 }}>
                {template.name} ({template.items.length})
              </Txt>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Txt muted style={{ paddingVertical: 8 }}>
          No templates yet.
        </Txt>
      )}
      <Button
        title={busy ? "Importing…" : "Import selected"}
        disabled={busy || selected.length === 0}
        onPress={submit}
      />
    </Sheet>
  );
}
