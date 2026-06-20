import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Copy, Ellipsis, LayoutTemplate, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, SectionList, View } from "react-native";
import { CategoryPicker } from "@/components/category-picker";
import { InlineAddItemRow, NewItemRow } from "@/components/inline-add-item";
import { ExportTargetPicker } from "@/components/template-export";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Field,
  HEADER_BUTTON_INSET,
  IconAction,
  IconActionBar,
  Loading,
  Screen,
  Sheet,
  Txt,
} from "@/ui";

type Template = FunctionReturnType<typeof api.templates.get>;
type TemplateItem = Template["items"][number];
type Category = FunctionReturnType<typeof api.categories.listByProject>[number];
/** A template item plus its position in the template's `items` array. */
type IndexedItem = TemplateItem & { index: number };
type Section = { title: string; category: string | null; data: IndexedItem[] };

/**
 * Group items by category, ordered like the list detail: the uncategorized
 * bucket first (so its items sit right under the always-visible add row at the
 * top), then the rest alphabetically; items within a section sort by name.
 */
function groupByCategory(
  items: TemplateItem[],
  uncategorized: string,
): Section[] {
  const groups = new Map<string, Section>();
  items.forEach((item, index) => {
    const category = item.category ?? null;
    const title = category ?? uncategorized;
    const bucket = groups.get(title);
    if (bucket) {
      bucket.data.push({ ...item, index });
    } else {
      groups.set(title, { title, category, data: [{ ...item, index }] });
    }
  });
  return [...groups.values()]
    .sort((a, b) => {
      if (a.category === null) return -1;
      if (b.category === null) return 1;
      return a.title.localeCompare(b.title);
    })
    .map((section) => ({
      ...section,
      data: section.data.sort((x, y) => x.name.localeCompare(y.name)),
    }));
}

export default function TemplateEditor() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const pid = useProjectId();
  const tid = templateId as Id<"listTemplates">;
  const t = useTheme();
  const tr = useTranslations("mobile.templates");
  const tc = useTranslations("mobile.common");
  const router = useRouter();

  const template = usePersistentQuery(api.templates.get, { templateId: tid });
  const categories = usePersistentQuery(api.categories.listByProject, {
    projectId: pid,
  });
  // Optimistic so an inline add re-sections instantly and consecutive adds read
  // the freshly-updated items (the mutation rewrites the whole array, so without
  // this a second add fired before the server round-trip would clobber the
  // first). Every update flows through here, so edits/deletes/settings reflect
  // immediately too.
  const update = useMutation(api.templates.update).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.templates.get, { templateId: tid });
      if (!current) {
        return;
      }
      store.setQuery(
        api.templates.get,
        { templateId: tid },
        {
          ...current,
          name: args.name,
          description: args.description,
          items: args.items,
        },
      );
    },
  );
  const remove = useMutation(api.templates.remove);
  const createList = useMutation(api.lists.create);

  // Which category section's inline add row is expanded (null = none); set after
  // each add so focus follows the item into the category it went to.
  const [activeAddCategory, setActiveAddCategory] = useState<string | null>(
    null,
  );
  // Edit state is lifted to the parent (persists through the sheet's slide-out).
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  // The settings sheet hosts the export-to-group picker inline (no second
  // Modal), mirroring the index actions sheet.
  const [showExport, setShowExport] = useState(false);

  const uncategorized = tr("uncategorized");
  const sections = useMemo(
    () => (template ? groupByCategory(template.items, uncategorized) : []),
    [template, uncategorized],
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

  /**
   * Append an item from an inline add row. Fire-and-forget: the optimistic
   * update inserts it instantly, so awaiting (which would blur the input and
   * drop the keyboard between consecutive adds) isn't needed. Always succeeds —
   * templates allow duplicate item names. Focus follows the item into its
   * category so the next entry continues there.
   */
  function handleInlineAdd(name: string, category: string | null): boolean {
    if (!template) {
      return false;
    }
    void persist([...template.items, { name, category }]);
    setActiveAddCategory(category);
    return true;
  }

  async function createListFromTemplate() {
    if (!template) {
      return;
    }
    closeSettings();
    const listId = await createList({
      projectId: pid,
      name: template.name,
      templateIds: [tid],
    });
    router.push(`/${pid}/lists/${listId}`);
  }

  function openEdit(item: IndexedItem) {
    setEditingIndex(item.index);
    setEditName(item.name);
    setEditCategory(item.category);
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
    setShowExport(false);
    setSettingsOpen(true);
  }

  function closeSettings() {
    setShowExport(false);
    setSettingsOpen(false);
  }

  async function saveSettings() {
    closeSettings();
    if (!template) {
      return;
    }
    await persist(template.items, settingsName, settingsDescription.trim());
  }

  function confirmDeleteTemplate() {
    if (!template) {
      return;
    }
    const name = template.name;
    Alert.alert(tr("deleteTemplate"), tr("deleteMessage", { name }), [
      { text: tc("cancel"), style: "cancel" },
      {
        text: tc("delete"),
        style: "destructive",
        onPress: () => {
          closeSettings();
          void remove({ templateId: tid }).then(() => router.back());
        },
      },
    ]);
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
            <Pressable
              onPress={openSettings}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={tr("templateSettings")}
              style={{ paddingHorizontal: HEADER_BUTTON_INSET }}
            >
              <Ellipsis color={t.primary} size={22} />
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
          <View style={{ paddingBottom: 8 }}>
            {/* Blurb plus a clear "this is a template" cue, in the same spot the
                list detail shows its description/provenance block. */}
            <View style={{ gap: 6, paddingBottom: 12 }}>
              {template.description ? (
                <Txt muted size={14} style={{ lineHeight: 20 }}>
                  {template.description}
                </Txt>
              ) : null}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <LayoutTemplate color={t.muted} size={14} />
                <Txt muted size={13}>
                  {`${tr("templateLabel")} · ${tr("itemCount", {
                    count: template.items.length,
                  })}`}
                </Txt>
              </View>
            </View>
            {/* Always-visible no-category entry point with the quick category
                chip; uncategorized items sort first, right below it. */}
            <NewItemRow
              categories={categories ?? []}
              onSubmit={handleInlineAdd}
            />
          </View>
        }
        ListEmptyComponent={
          <Txt muted style={{ padding: 16 }}>
            {tr("noItems")}
          </Txt>
        }
        renderSectionHeader={({ section }) =>
          section.category !== null ? (
            <Txt
              muted
              size={12}
              style={{ paddingTop: 16, paddingBottom: 4, letterSpacing: 1 }}
            >
              {section.title.toUpperCase()}
            </Txt>
          ) : null
        }
        renderSectionFooter={({ section }) => {
          const category = section.category;
          // The no-category section's entry point is the always-visible row at
          // the top; only categorized sections get their own inline add row.
          if (category === null) {
            return null;
          }
          return (
            <InlineAddItemRow
              active={activeAddCategory === category}
              onActivate={() => setActiveAddCategory(category)}
              onDeactivate={() =>
                setActiveAddCategory((prev) =>
                  prev === category ? null : prev,
                )
              }
              onSubmit={(name) => handleInlineAdd(name, category)}
            />
          );
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            style={{
              paddingVertical: 10,
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
        onSave={saveEdit}
        onDelete={deleteEditingItem}
        onClose={() => setEditingIndex(null)}
      />

      <Sheet visible={settingsOpen} onClose={closeSettings}>
        <Txt size={18} weight="700">
          {tr("templateSettings")}
        </Txt>
        {showExport ? (
          <ExportTargetPicker
            templateId={tid}
            currentProjectId={pid}
            onExported={(name) => {
              closeSettings();
              Alert.alert(tr("exportedTitle"), tr("exportedMessage", { name }));
            }}
            onBack={() => setShowExport(false)}
          />
        ) : (
          <>
            <Field
              placeholder={tr("namePlaceholder")}
              value={settingsName}
              onChangeText={setSettingsName}
            />
            <Field
              placeholder={tr("descriptionPlaceholder")}
              value={settingsDescription}
              onChangeText={setSettingsDescription}
            />
            <Button title={tc("save")} onPress={saveSettings} />
            <Button
              title={tr("createListFromTemplate")}
              variant="ghost"
              onPress={createListFromTemplate}
            />
            {/* Secondary template actions as a compact icon toolbar, matching
                the list settings sheet. */}
            <IconActionBar>
              <IconAction
                icon={Copy}
                caption={tr("exportCaption")}
                label={tr("exportToGroup")}
                onPress={() => setShowExport(true)}
              />
              <IconAction
                icon={Trash2}
                destructive
                caption={tc("delete")}
                label={tr("deleteTemplate")}
                onPress={confirmDeleteTemplate}
              />
            </IconActionBar>
          </>
        )}
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
  onSave,
  onDelete,
  onClose,
}: {
  visible: boolean;
  name: string;
  category: string | null;
  categories: Category[];
  onChangeName: (value: string) => void;
  onChangeCategory: (value: string | null) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const t = useTranslations("mobile.templates");
  const tc = useTranslations("mobile.common");
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {t("editItem")}
      </Txt>
      <Field
        placeholder={t("namePlaceholder")}
        value={name}
        onChangeText={onChangeName}
      />
      <CategoryPicker
        categories={categories}
        value={category}
        onChange={onChangeCategory}
      />
      <Button title={tc("save")} onPress={onSave} />
      <Pressable onPress={onDelete} style={{ padding: 10 }}>
        <Txt style={{ textAlign: "center", color: theme.danger }}>
          {t("deleteItem")}
        </Txt>
      </Pressable>
    </Sheet>
  );
}
