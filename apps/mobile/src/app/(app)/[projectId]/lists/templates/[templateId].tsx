import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Copy, Ellipsis, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, SectionList, View } from "react-native";
import { CategoryPicker } from "@/components/category-picker";
import { ExportTargetPicker } from "@/components/template-export";
import { useTranslations } from "@/i18n";
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

/** Group items by their category name, sorted like the PWA (category & item alpha). */
function groupByCategory(items: TemplateItem[], uncategorized: string) {
  const groups = new Map<string, IndexedItem[]>();
  items.forEach((item, index) => {
    const key = item.category ?? uncategorized;
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
  const tr = useTranslations("mobile.templates");
  const tc = useTranslations("mobile.common");
  const router = useRouter();

  const template = useQuery(api.templates.get, { templateId: tid });
  const categories = useQuery(api.categories.listByProject, { projectId: pid });
  const update = useMutation(api.templates.update);
  const remove = useMutation(api.templates.remove);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string | null>(null);
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
          <View style={{ gap: 8, paddingBottom: 12 }}>
            {template.description ? (
              <Txt muted style={{ paddingBottom: 4 }}>
                {template.description}
              </Txt>
            ) : null}
            <Field
              placeholder={tr("addItemPlaceholder")}
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
                />
              </View>
              <Button title={tc("add")} onPress={addItem} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Txt muted style={{ padding: 16 }}>
            {tr("noItems")}
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
