import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { Stack, useRouter } from "expo-router";
import {
  Ellipsis,
  LayoutTemplate,
  ListX,
  Star,
  Trash2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, View } from "react-native";
import { ListChecklist } from "@/components/list-checklist";
import { useTranslations } from "@/i18n";
import {
  useOfflineListGet,
  usePersistentQuery,
  useQueuedMutation,
} from "@/lib/offline";
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

/**
 * The full list-detail screen, rendered by a route's nested Stack. It lives in
 * `components` rather than a route file because the same screen is reachable
 * from two stacks: the lists tab (`lists/[listId]`) and the calendar tab
 * (`calendar/list/[listId]`, so Back from a list opened off an event returns to
 * the event). `initialTitle` seeds the header so it doesn't flash the route
 * segment while the list query resolves.
 */
export function ListDetailScreen({
  listId,
  initialTitle,
}: {
  listId: string;
  initialTitle?: string;
}) {
  const pid = useProjectId();
  const lid = listId as Id<"lists">;
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  const router = useRouter();

  const list = useOfflineListGet(lid);
  const toggleFavorite = useQueuedMutation(api.lists.toggleFavorite);
  const updateList = useQueuedMutation(api.lists.update);
  const removeList = useQueuedMutation(api.lists.remove);
  const clearCompleted = useQueuedMutation(api.lists.clearCompleted);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  useEffect(() => {
    if (list === null && router.canGoBack()) {
      router.back();
    }
  }, [list, router]);

  const headerTitle = list?.name ?? initialTitle ?? "";

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

  function handleClearCompleted() {
    Alert.alert(tl("clearCompleted"), tl("clearCompletedMessage"), [
      { text: tc("cancel"), style: "cancel" },
      {
        text: tl("clearCompletedAction"),
        style: "destructive",
        onPress: () => {
          setSettingsOpen(false);
          void clearCompleted({ listId: lid });
        },
      },
    ]);
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
              }
            : {}),
        }}
      />

      {list == null ? (
        <Loading />
      ) : (
        <>
          <ListChecklist listId={lid} />

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
            onClearCompleted={handleClearCompleted}
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
      <IconActionBar>
        <IconAction
          icon={Star}
          active={favorite}
          caption={tl("favoriteCaption")}
          label={favorite ? tl("removeFromFavorites") : tl("addToFavorites")}
          onPress={onToggleFavorite}
        />
        <IconAction
          icon={LayoutTemplate}
          caption={tl("templatesCaption")}
          label={tl("importTemplates")}
          onPress={onImportTemplates}
        />
        <IconAction
          icon={ListX}
          caption={tl("clearCaption")}
          label={tl("clearCompleted")}
          onPress={onClearCompleted}
        />
        <IconAction
          icon={Trash2}
          destructive
          caption={tl("deleteCaption")}
          label={tl("deleteList")}
          onPress={onDelete}
        />
      </IconActionBar>
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
  const templates = usePersistentQuery(api.templates.listByProject, {
    projectId,
  });
  const importTemplates = useQueuedMutation(api.lists.importTemplates);
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
