import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, View } from "react-native";
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
  const { projectId, listId } = useLocalSearchParams<{
    projectId: string;
    listId: string;
  }>();
  const pid = projectId as Id<"projects">;
  const lid = listId as Id<"lists">;
  const t = useTheme();
  const router = useRouter();

  const list = useQuery(api.lists.get, { listId: lid });
  const categories = useQuery(api.categories.listByProject, { projectId: pid });
  const createItem = useMutation(api.listItems.create);
  const removeItem = useMutation(api.listItems.remove);
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
  const [editing, setEditing] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editCategory, setEditCategory] = useState<Id<"categories"> | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  const sections = useMemo(
    () => (list ? groupByCategory(list.items) : []),
    [list],
  );

  async function addItem() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setName("");
    await createItem({ listId: lid, name: trimmed });
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
          <View style={{ flexDirection: "row", gap: 8, paddingBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                placeholder="Add an item…"
                value={name}
                onChangeText={setName}
                onSubmitEditing={addItem}
                returnKeyType="done"
              />
            </View>
            <Button title="Add" onPress={addItem} />
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
        onClearCompleted={async () => {
          setSettingsOpen(false);
          await clearCompleted({ listId: lid });
        }}
        onDelete={handleDeleteList}
        onClose={() => setSettingsOpen(false)}
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        <CategoryChip
          label="None"
          active={categoryId === null}
          onPress={() => onChangeCategory(null)}
        />
        {categories.map((category) => (
          <CategoryChip
            key={category._id}
            label={category.name}
            active={categoryId === category._id}
            onPress={() => onChangeCategory(category._id)}
          />
        ))}
      </ScrollView>
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

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
        backgroundColor: active ? t.primary : "transparent",
      }}
    >
      <Txt size={14} style={{ color: active ? t.onPrimary : t.text }}>
        {label}
      </Txt>
    </Pressable>
  );
}
