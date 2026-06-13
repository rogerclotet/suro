import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { Copy, Ellipsis, LayoutTemplate, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { headerCreateAction } from "@/components/header-badges";
import { ExportTargetPicker } from "@/components/template-export";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Fab,
  Field,
  IconAction,
  IconActionBar,
  Loading,
  Screen,
  Sheet,
  Txt,
  useFabScroll,
} from "@/ui";

type Template = FunctionReturnType<typeof api.templates.listByProject>[number];

export default function Templates() {
  const pid = useProjectId();
  const templates = useQuery(api.templates.listByProject, { projectId: pid });
  const router = useRouter();
  const tr = useTranslations("mobile.templates");

  const [creating, setCreating] = useState(false);
  const fab = useFabScroll();
  // Visibility is separate from the content so the sheet keeps showing the
  // template while it slides out (matches the other sheets in the app).
  const [actionsVisible, setActionsVisible] = useState(false);
  const [actionsTemplate, setActionsTemplate] = useState<Template | null>(null);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tr("title"),
          ...headerCreateAction({
            onPress: () => setCreating(true),
            label: tr("newTemplate"),
          }),
        }}
      />
      {templates === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={templates}
          onScroll={fab.onScroll}
          scrollEventThrottle={16}
          keyExtractor={(template) => template._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 10 }}
          ListEmptyComponent={
            <Txt muted style={{ paddingVertical: 24, textAlign: "center" }}>
              {tr("empty")}
            </Txt>
          }
          renderItem={({ item }) => (
            <TemplateCard
              template={item}
              onOpen={() => router.push(`/${pid}/lists/templates/${item._id}`)}
              onActions={() => {
                setActionsTemplate(item);
                setActionsVisible(true);
              }}
            />
          )}
        />
      )}

      <Fab
        onPress={() => setCreating(true)}
        label={tr("newTemplate")}
        extended={fab.extended}
      />
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

// A template row as a self-contained card: a primary-tinted icon badge, the
// name + description + item count, and a trailing overflow that opens the
// actions sheet. The body and the overflow are sibling Pressables inside a
// non-pressable card, so tapping the menu never also navigates into the editor.
function TemplateCard({
  template,
  onOpen,
  onActions,
}: {
  template: Template;
  onOpen: () => void;
  onActions: () => void;
}) {
  const t = useTheme();
  const tr = useTranslations("mobile.templates");
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: t.card,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 14,
        paddingLeft: 14,
        paddingRight: 6,
      }}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 14,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${t.primary}1a`,
          }}
        >
          <LayoutTemplate color={t.primary} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={16} weight="700">
            {template.name}
          </Txt>
          {template.description ? (
            <Txt muted size={13} numberOfLines={2} style={{ marginTop: 1 }}>
              {template.description}
            </Txt>
          ) : null}
          <Txt muted size={12} style={{ marginTop: 2 }}>
            {tr("itemCount", { count: template.items.length })}
          </Txt>
        </View>
      </Pressable>
      <Pressable
        onPress={onActions}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tr("templateSettings")}
        style={({ pressed }) => ({ padding: 10, opacity: pressed ? 0.6 : 1 })}
      >
        <Ellipsis color={t.muted} size={20} />
      </Pressable>
    </View>
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
  const createList = useMutation(api.lists.create);
  const remove = useMutation(api.templates.remove);
  const router = useRouter();
  const t = useTranslations("mobile.templates");
  const tc = useTranslations("mobile.common");
  const [showExport, setShowExport] = useState(false);

  function close() {
    setShowExport(false);
    onClose();
  }

  async function createListFromTemplate() {
    if (!template) {
      return;
    }
    const listId = await createList({
      projectId,
      name: template.name,
      templateIds: [template._id],
    });
    close();
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
            close();
            void remove({ templateId: target._id });
          },
        },
      ],
    );
  }

  return (
    <Sheet visible={visible} onClose={close}>
      <Txt size={18} weight="700">
        {template?.name ?? ""}
      </Txt>
      {template ? (
        <Txt muted size={13}>
          {t("itemCount", { count: template.items.length })}
        </Txt>
      ) : null}
      {showExport && template ? (
        <ExportTargetPicker
          templateId={template._id}
          currentProjectId={projectId}
          onExported={(name) => {
            close();
            Alert.alert(t("exportedTitle"), t("exportedMessage", { name }));
          }}
          onBack={() => setShowExport(false)}
        />
      ) : (
        <>
          <Button
            title={t("createListFromTemplate")}
            onPress={createListFromTemplate}
          />
          {/* Secondary template actions as a compact icon toolbar, matching the
              list settings sheet. */}
          <IconActionBar>
            <IconAction
              icon={Copy}
              caption={t("exportCaption")}
              label={t("exportToGroup")}
              onPress={() => setShowExport(true)}
            />
            <IconAction
              icon={Trash2}
              destructive
              caption={tc("delete")}
              label={t("deleteTemplate")}
              onPress={confirmDelete}
            />
          </IconActionBar>
        </>
      )}
    </Sheet>
  );
}
