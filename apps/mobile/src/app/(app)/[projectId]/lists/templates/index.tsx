import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { LayoutTemplate } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { headerCreateAction } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Fab,
  Field,
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
  const t = useTheme();
  const tr = useTranslations("mobile.templates");

  const [creating, setCreating] = useState(false);
  const fab = useFabScroll();

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
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                marginHorizontal: 16,
                backgroundColor: t.border,
              }}
            />
          )}
          ListEmptyComponent={
            <Txt muted style={{ paddingVertical: 24, textAlign: "center" }}>
              {tr("empty")}
            </Txt>
          }
          renderItem={({ item }) => (
            <TemplateRow
              template={item}
              onOpen={() => router.push(`/${pid}/lists/templates/${item._id}`)}
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
    </Screen>
  );
}

// A template as a tappable row, mirroring the lists list: a primary-tinted icon
// badge, then the name over a single muted subtitle (its description, or the
// item count when it has none). Per-template actions live in the editor's
// settings sheet, so the whole row just navigates in — no trailing overflow.
function TemplateRow({
  template,
  onOpen,
}: {
  template: Template;
  onOpen: () => void;
}) {
  const t = useTheme();
  const tr = useTranslations("mobile.templates");
  const subtitle =
    template.description ?? tr("itemCount", { count: template.items.length });
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: pressed ? t.border : "transparent",
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
        <Txt size={16}>{template.name}</Txt>
        <Txt muted size={13} numberOfLines={1} style={{ marginTop: 2 }}>
          {subtitle}
        </Txt>
      </View>
    </Pressable>
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
