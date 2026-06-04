import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { ChevronRight, LayoutTemplate, Tag } from "lucide-react-native";
import { type ReactNode, useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, Switch, View } from "react-native";
import { sectionHeaderBadges } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

type ListsResult = FunctionReturnType<typeof api.lists.listByProject>;
type ListWithItems = ListsResult[number];

function isCompleted(list: ListWithItems) {
  return list.items.length > 0 && list.items.every((item) => item.completed);
}

export default function ListsOverview() {
  const pid = useProjectId();
  const lists = useQuery(api.lists.listByProject, { projectId: pid });
  const router = useRouter();
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  const [creating, setCreating] = useState(false);

  const sections = useMemo(() => {
    if (!lists) {
      return [];
    }
    return [
      { title: tl("sectionFavorites"), data: lists.filter((l) => l.favorite) },
      {
        title: tl("sectionLists"),
        data: lists.filter((l) => !l.favorite && !isCompleted(l)),
      },
      {
        title: tl("sectionCompleted"),
        data: lists.filter((l) => !l.favorite && isCompleted(l)),
      },
    ].filter((section) => section.data.length > 0);
  }, [lists, tl]);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tl("title"),
          ...sectionHeaderBadges("lists"),
        }}
      />
      {lists === undefined ? (
        <Loading />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View
              style={{
                backgroundColor: t.card,
                borderColor: t.border,
                borderWidth: 1,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <NavRow
                icon={<LayoutTemplate color={t.primary} size={20} />}
                label={tl("templates")}
                onPress={() => router.push(`/${pid}/lists/templates`)}
              />
              <View
                style={{
                  height: 1,
                  marginLeft: 46,
                  backgroundColor: t.border,
                }}
              />
              <NavRow
                icon={<Tag color={t.primary} size={20} />}
                label={tl("categories")}
                onPress={() => router.push(`/${pid}/lists/categories`)}
              />
            </View>
          }
          ListEmptyComponent={
            <Txt muted style={{ paddingVertical: 24, textAlign: "center" }}>
              {tl("empty")}
            </Txt>
          }
          renderSectionHeader={({ section }) => (
            <Txt
              muted
              size={12}
              style={{ paddingTop: 16, paddingBottom: 4, letterSpacing: 1 }}
            >
              {section.title.toUpperCase()}
            </Txt>
          )}
          renderItem={({ item }) => {
            const done = item.items.filter((i) => i.completed).length;
            return (
              <Pressable
                style={{ marginBottom: 8 }}
                onPress={() => router.push(`/${pid}/lists/${item._id}`)}
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
                  <Txt muted size={13}>
                    {item.items.length === 0
                      ? tc("empty")
                      : tc("itemsDone", {
                          done,
                          total: item.items.length,
                        })}
                  </Txt>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Fab onPress={() => setCreating(true)} />
      <CreateListSheet
        visible={creating}
        projectId={pid}
        onClose={() => setCreating(false)}
      />
    </Screen>
  );
}

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: pressed ? t.border : "transparent",
      })}
    >
      <View style={{ width: 20, alignItems: "center" }}>{icon}</View>
      <Txt size={16} style={{ flex: 1 }}>
        {label}
      </Txt>
      <ChevronRight color={t.muted} size={18} />
    </Pressable>
  );
}

function CreateListSheet({
  visible,
  projectId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  onClose: () => void;
}) {
  const templates = useQuery(api.templates.listByProject, { projectId });
  const createList = useMutation(api.lists.create);
  const router = useRouter();
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Id<"listTemplates">[]>([]);
  const [busy, setBusy] = useState(false);

  function toggleTemplate(id: Id<"listTemplates">) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setBusy(true);
    try {
      const listId = await createList({
        projectId,
        name: trimmed,
        description: description.trim() || undefined,
        templateIds: selected.length > 0 ? selected : undefined,
      });
      setName("");
      setDescription("");
      setSelected([]);
      onClose();
      router.push(`/${projectId}/lists/${listId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tl("newList")}
      </Txt>
      <Field
        placeholder={tl("namePlaceholder")}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Field
        placeholder={tl("descriptionPlaceholder")}
        value={description}
        onChangeText={setDescription}
      />
      {templates && templates.length > 0 ? (
        <>
          <Txt muted size={13}>
            {tl("includeTemplates")}
          </Txt>
          <ScrollView style={{ maxHeight: 200 }}>
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
                  onValueChange={() => toggleTemplate(template._id)}
                  trackColor={{ true: t.primary, false: t.border }}
                />
                <Txt style={{ flex: 1 }}>
                  {template.name} ({template.items.length})
                </Txt>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}
      <Button
        title={busy ? tc("creating") : tl("createList")}
        disabled={busy || name.trim().length === 0}
        onPress={create}
      />
    </Sheet>
  );
}
