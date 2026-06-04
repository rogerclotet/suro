import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Check,
  Download,
  Ellipsis,
  Eraser,
  type LucideIcon,
  Plus,
  Star,
  Trash2,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  Switch,
  View,
} from "react-native";
import { CategoryPicker } from "@/components/category-picker";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Fab,
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

function groupByCategory(items: Item[], uncategorized: string) {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.category?.name ?? uncategorized;
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
  const { listId, name: initialTitle } = useLocalSearchParams<{
    listId: string;
    name?: string;
  }>();
  const pid = useProjectId();
  const lid = listId as Id<"lists">;
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
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

  // The create and edit flows share one drawer (`ItemSheet`) and one draft form;
  // `mode` picks the title/action, and `editingItem` is the target when editing.
  // The mode and target persist while the sheet slides out so its content
  // doesn't flicker during the close animation.
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [itemSheetMode, setItemSheetMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDetails, setDraftDetails] = useState("");
  const [draftCategory, setDraftCategory] = useState<Id<"categories"> | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  // Opening the import sheet while the settings sheet is still animating out
  // would stack two Modals; defer it until settings reports it has closed.
  const [pendingImport, setPendingImport] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  const uncategorized = tl("uncategorized");
  const sections = useMemo(
    () => (list ? groupByCategory(list.items, uncategorized) : []),
    [list, uncategorized],
  );

  // Render the header title from the loaded list, falling back to the name
  // passed at navigation time so the title never flashes the "[listId]" route
  // segment while the list query resolves.
  const headerTitle = list?.name ?? initialTitle ?? "";

  async function onCreateCategory(categoryName: string) {
    return createCategory({ projectId: pid, name: categoryName });
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

  function openCreate() {
    setItemSheetMode("create");
    setEditingItem(null);
    setDraftName("");
    setDraftDetails("");
    setDraftCategory(null);
    setItemSheetOpen(true);
  }

  function openEdit(item: Item) {
    setItemSheetMode("edit");
    setEditingItem(item);
    setDraftName(item.name);
    setDraftDetails(item.details ?? "");
    setDraftCategory(item.categoryId ?? null);
    setItemSheetOpen(true);
  }

  async function submitItem() {
    const trimmed = draftName.trim();
    if (itemSheetMode === "create") {
      if (!trimmed) {
        return;
      }
      setItemSheetOpen(false);
      await createItem({
        listId: lid,
        name: trimmed,
        details: draftDetails.trim() || undefined,
        categoryId: draftCategory,
      });
      return;
    }
    if (!editingItem) {
      return;
    }
    const target = editingItem;
    setItemSheetOpen(false);
    await updateItem({
      itemId: target._id,
      name: trimmed || target.name,
      details: draftDetails,
      completed: target.completed,
      categoryId: draftCategory,
    });
  }

  async function deleteCurrentItem() {
    if (!editingItem) {
      return;
    }
    const target = editingItem;
    setItemSheetOpen(false);
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

  function handleDeleteList() {
    if (!list) {
      return;
    }
    // Confirm before the irreversible delete; keep the settings sheet open
    // behind the alert so cancelling lands back where the user was.
    Alert.alert(
      tl("deleteList"),
      tl("deleteListMessage", { name: list.name }),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => {
            setSettingsOpen(false);
            void removeList({ listId: lid }).then(() => router.back());
          },
        },
      ],
    );
  }

  function handleToggleFavorite() {
    void toggleFavorite({ listId: lid });
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: headerTitle,
          ...(list
            ? {
                // Android: only the settings overflow lives in the header (create
                // is the Fab). iOS: the create "+" and settings both sit in the
                // Liquid Glass bar via the multi-item API, which supersedes
                // `headerRight` there.
                headerRight: () => (
                  <Pressable
                    onPress={openSettings}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={tl("listSettings")}
                    style={{ paddingHorizontal: HEADER_BUTTON_INSET }}
                  >
                    <Ellipsis color={t.primary} size={22} />
                  </Pressable>
                ),
                ...(Platform.OS === "ios"
                  ? {
                      unstable_headerRightItems: () => [
                        {
                          type: "custom" as const,
                          element: (
                            <Pressable
                              onPress={openCreate}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={tl("newItem")}
                            >
                              <Plus color={t.primary} size={22} />
                            </Pressable>
                          ),
                        },
                        {
                          type: "custom" as const,
                          element: (
                            <Pressable
                              onPress={openSettings}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={tl("listSettings")}
                            >
                              <Ellipsis color={t.primary} size={22} />
                            </Pressable>
                          ),
                        },
                      ],
                    }
                  : {}),
              }
            : {}),
        }}
      />

      {list === undefined ? (
        <Loading />
      ) : (
        <>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            stickySectionHeadersEnabled={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              list.description ? (
                // Set off the description as a quoted note — an accent rail and
                // breathing room mark it as the list's blurb rather than chrome.
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    paddingBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 3,
                      borderRadius: 999,
                      backgroundColor: t.primary,
                      opacity: 0.5,
                    }}
                  />
                  <Txt
                    muted
                    size={14}
                    style={{ flex: 1, lineHeight: 20, paddingVertical: 1 }}
                  >
                    {list.description}
                  </Txt>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Txt muted style={{ padding: 16 }}>
                {tl("noItems")}
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
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: item.completed ? t.primary : t.muted,
                    backgroundColor: item.completed ? t.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.completed ? (
                    <Check color={t.onPrimary} size={16} strokeWidth={3} />
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

          <Fab onPress={openCreate} label={tl("newItem")} />

          <ItemSheet
            visible={itemSheetOpen}
            mode={itemSheetMode}
            name={draftName}
            details={draftDetails}
            categoryId={draftCategory}
            categories={categories ?? []}
            onChangeName={setDraftName}
            onChangeDetails={setDraftDetails}
            onChangeCategory={setDraftCategory}
            onCreateCategory={onCreateCategory}
            onSubmit={submitItem}
            onDelete={deleteCurrentItem}
            onClose={() => setItemSheetOpen(false)}
          />

          <SettingsSheet
            visible={settingsOpen}
            name={listName}
            description={listDescription}
            favorite={list.favorite}
            onChangeName={setListName}
            onChangeDescription={setListDescription}
            onToggleFavorite={handleToggleFavorite}
            onSave={saveSettings}
            onImportTemplates={() => {
              setPendingImport(true);
              setSettingsOpen(false);
            }}
            onClearCompleted={async () => {
              setSettingsOpen(false);
              await clearCompleted({ listId: lid });
            }}
            onDelete={handleDeleteList}
            onClose={() => setSettingsOpen(false)}
            onClosed={() => {
              if (pendingImport) {
                setPendingImport(false);
                setImportOpen(true);
              }
            }}
          />

          <ImportTemplatesSheet
            visible={importOpen}
            projectId={pid}
            listId={lid}
            onClose={() => setImportOpen(false)}
          />
        </>
      )}
    </Screen>
  );
}

// Shared create/edit drawer for a list item. In "create" mode it autofocuses
// the name and hides the destructive action; in "edit" mode it offers Save and
// Delete. Same form either way, so the two flows stay visually identical.
function ItemSheet({
  visible,
  mode,
  name,
  details,
  categoryId,
  categories,
  onChangeName,
  onChangeDetails,
  onChangeCategory,
  onCreateCategory,
  onSubmit,
  onDelete,
  onClose,
}: {
  visible: boolean;
  mode: "create" | "edit";
  name: string;
  details: string;
  categoryId: Id<"categories"> | null;
  categories: Category[];
  onChangeName: (value: string) => void;
  onChangeDetails: (value: string) => void;
  onChangeCategory: (value: Id<"categories"> | null) => void;
  onCreateCategory: (name: string) => Promise<Id<"categories">>;
  onSubmit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  const isCreate = mode === "create";
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {isCreate ? tl("newItem") : tl("editItem")}
      </Txt>
      <Field
        placeholder={tl("namePlaceholder")}
        value={name}
        onChangeText={onChangeName}
        autoFocus={isCreate}
        returnKeyType={isCreate ? "done" : undefined}
        onSubmitEditing={isCreate ? onSubmit : undefined}
      />
      <Field
        placeholder={tl("detailsPlaceholder")}
        value={details}
        onChangeText={onChangeDetails}
        multiline
        textAlignVertical="top"
        style={{ minHeight: 88, paddingTop: 11 }}
      />
      <CategoryPicker
        categories={categories}
        value={categoryId}
        onChange={onChangeCategory}
        onCreate={onCreateCategory}
      />
      <Button title={isCreate ? tc("add") : tc("save")} onPress={onSubmit} />
      {isCreate ? null : (
        <Pressable onPress={onDelete} style={{ padding: 10 }}>
          <Txt style={{ textAlign: "center", color: DESTRUCTIVE }}>
            {tl("deleteItem")}
          </Txt>
        </Pressable>
      )}
    </Sheet>
  );
}

function SettingsSheet({
  visible,
  name,
  description,
  favorite,
  onChangeName,
  onChangeDescription,
  onToggleFavorite,
  onSave,
  onImportTemplates,
  onClearCompleted,
  onDelete,
  onClose,
  onClosed,
}: {
  visible: boolean;
  name: string;
  description: string;
  favorite: boolean;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onToggleFavorite: () => void;
  onSave: () => void;
  onImportTemplates: () => void;
  onClearCompleted: () => void;
  onDelete: () => void;
  onClose: () => void;
  onClosed: () => void;
}) {
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  return (
    <Sheet visible={visible} onClose={onClose} onClosed={onClosed}>
      <Txt size={18} weight="700">
        {tl("listSettings")}
      </Txt>
      <Field
        placeholder={tl("namePlaceholder")}
        value={name}
        onChangeText={onChangeName}
      />
      <Field
        placeholder={tl("descriptionPlaceholder")}
        value={description}
        onChangeText={onChangeDescription}
        multiline
        textAlignVertical="top"
        style={{ minHeight: 88, paddingTop: 11 }}
      />
      <Button title={tc("save")} onPress={onSave} />
      {/* Secondary list actions as a compact icon toolbar. */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <IconAction
          icon={Star}
          active={favorite}
          label={favorite ? tl("removeFromFavorites") : tl("addToFavorites")}
          onPress={onToggleFavorite}
        />
        <IconAction
          icon={Download}
          label={tl("importTemplates")}
          onPress={onImportTemplates}
        />
        <IconAction
          icon={Eraser}
          label={tl("clearCompleted")}
          onPress={onClearCompleted}
        />
        <IconAction
          icon={Trash2}
          destructive
          label={tl("deleteList")}
          onPress={onDelete}
        />
      </View>
    </Sheet>
  );
}

const DESTRUCTIVE = "#e64553";

// Square icon button for a sheet's action toolbar — label drives accessibility
// only; `active` fills the glyph (favorite), `destructive` tints it red.
function IconAction({
  icon: Icon,
  label,
  onPress,
  active,
  destructive,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  destructive?: boolean;
}) {
  const t = useTheme();
  const color = destructive ? DESTRUCTIVE : active ? t.primary : t.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: destructive ? DESTRUCTIVE : t.border,
        backgroundColor: t.inputBg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon color={color} size={20} fill={active ? color : "none"} />
    </Pressable>
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
  const tl = useTranslations("mobile.lists");
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
        {tl("importTemplates")}
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
          {tl("noTemplates")}
        </Txt>
      )}
      <Button
        title={busy ? tl("importing") : tl("importSelected")}
        disabled={busy || selected.length === 0}
        onPress={submit}
      />
    </Sheet>
  );
}
