import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { Check, LayoutTemplate, Tag } from "lucide-react-native";
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
          ...sectionHeaderBadges("lists", {
            onPress: () => setCreating(true),
            label: tl("newList"),
          }),
        }}
      />
      {lists === undefined ? (
        <Loading />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View
              style={{ flexDirection: "row", gap: 12, marginHorizontal: 16 }}
            >
              <NavTile
                icon={<LayoutTemplate color={t.primary} size={22} />}
                label={tl("templates")}
                onPress={() => router.push(`/${pid}/lists/templates`)}
              />
              <NavTile
                icon={<Tag color={t.primary} size={22} />}
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
              style={{
                paddingTop: 16,
                paddingBottom: 4,
                paddingHorizontal: 16,
                letterSpacing: 1,
              }}
            >
              {section.title.toUpperCase()}
            </Txt>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                marginLeft: 48,
                marginRight: 16,
                backgroundColor: t.border,
              }}
            />
          )}
          renderItem={({ item }) => {
            const total = item.items.length;
            const done = item.items.filter((i) => i.completed).length;
            const pending = total - done;
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: `/${pid}/lists/${item._id}`,
                    params: { name: item.name },
                  })
                }
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? t.border : "transparent",
                })}
              >
                <View style={{ width: 20, alignItems: "center" }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      backgroundColor: t.marker,
                      transform: [{ rotate: "45deg" }],
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={16}>{item.name}</Txt>
                  {item.description ? (
                    <Txt
                      muted
                      size={13}
                      numberOfLines={1}
                      style={{ marginTop: 2 }}
                    >
                      {item.description}
                    </Txt>
                  ) : null}
                </View>
                {total === 0 ? null : pending > 0 ? (
                  // A count chip reads as "items left" — clearer than a bare
                  // number floating at the row's edge.
                  <View
                    style={{
                      minWidth: 26,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: t.border,
                    }}
                  >
                    <Txt size={13} weight="700">
                      {pending}
                    </Txt>
                  </View>
                ) : (
                  // All done: a check beats showing "0".
                  <Check color={t.primary} size={18} />
                )}
              </Pressable>
            );
          }}
        />
      )}

      <Fab onPress={() => setCreating(true)} label={tl("newList")} />
      <CreateListSheet
        visible={creating}
        projectId={pid}
        onClose={() => setCreating(false)}
      />
    </Screen>
  );
}

// A square-ish launcher tile for a list subsection (templates, categories).
// Deliberately distinct from the full-width list cards below: side-by-side,
// icon-forward, with the icon in a primary-tinted badge.
function NavTile({
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
        flex: 1,
        aspectRatio: 1.3,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        justifyContent: "space-between",
        backgroundColor: pressed ? t.border : t.card,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${t.primary}1a`,
        }}
      >
        {icon}
      </View>
      <Txt size={15} weight="700">
        {label}
      </Txt>
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
      router.push({
        pathname: `/${projectId}/lists/${listId}`,
        params: { name: trimmed },
      });
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
        multiline
        textAlignVertical="top"
        style={{ minHeight: 88, paddingTop: 11 }}
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
