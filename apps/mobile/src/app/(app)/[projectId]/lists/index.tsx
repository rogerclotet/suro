import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { Check, ChevronDown, CircleUser } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, Switch, View } from "react-native";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Card,
  Fab,
  Field,
  HeaderButton,
  Loading,
  Screen,
  Sheet,
  Txt,
} from "@/ui";

type ListsResult = FunctionReturnType<typeof api.lists.listByProject>;
type ListWithItems = ListsResult[number];

function isCompleted(list: ListWithItems) {
  return list.items.length > 0 && list.items.every((item) => item.completed);
}

export default function ListsOverview() {
  const pid = useProjectId();
  const project = useQuery(api.projects.get, { projectId: pid });
  const lists = useQuery(api.lists.listByProject, { projectId: pid });
  const toggleFavorite = useMutation(api.lists.toggleFavorite);
  const router = useRouter();
  const t = useTheme();
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(false);

  const sections = useMemo(() => {
    if (!lists) {
      return [];
    }
    return [
      { title: "Favorites", data: lists.filter((l) => l.favorite) },
      {
        title: "Lists",
        data: lists.filter((l) => !l.favorite && !isCompleted(l)),
      },
      {
        title: "Completed",
        data: lists.filter((l) => !l.favorite && isCompleted(l)),
      },
    ].filter((section) => section.data.length > 0);
  }, [lists]);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Lists",
          headerLeft: () => (
            <HeaderButton
              onPress={() => setSwitching(true)}
              accessibilityLabel="Switch group"
            >
              <Txt
                numberOfLines={1}
                style={{ color: t.primary, maxWidth: 160 }}
              >
                {project?.name ?? "Groups"}
              </Txt>
              <ChevronDown color={t.primary} size={16} />
            </HeaderButton>
          ),
          headerRight: () => (
            <HeaderButton
              onPress={() => router.push("/profile")}
              accessibilityLabel="Profile"
            >
              <CircleUser color={t.primary} size={22} />
            </HeaderButton>
          ),
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
            <View style={{ flexDirection: "row", gap: 20, paddingBottom: 8 }}>
              <Pressable
                onPress={() => router.push(`/${pid}/lists/categories`)}
              >
                <Txt style={{ color: t.primary }}>Categories</Txt>
              </Pressable>
              <Pressable onPress={() => router.push(`/${pid}/lists/templates`)}>
                <Txt style={{ color: t.primary }}>Templates</Txt>
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <Txt muted style={{ paddingVertical: 24, textAlign: "center" }}>
              No lists yet. Tap + to create one.
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Pressable
                  style={{ flex: 1 }}
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
                        ? "Empty"
                        : `${done}/${item.items.length} done`}
                    </Txt>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => void toggleFavorite({ listId: item._id })}
                  hitSlop={10}
                  style={{ padding: 6 }}
                >
                  <Txt size={22} style={{ color: t.primary }}>
                    {item.favorite ? "★" : "☆"}
                  </Txt>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* Hide the FAB while a sheet is open so its shadow doesn't ride up
          with the slide-in drawer animation. */}
      {!creating && !switching && <Fab onPress={() => setCreating(true)} />}
      <CreateListSheet
        visible={creating}
        projectId={pid}
        onClose={() => setCreating(false)}
      />
      <GroupSwitcherSheet
        visible={switching}
        currentProjectId={pid}
        onClose={() => setSwitching(false)}
      />
    </Screen>
  );
}

function GroupSwitcherSheet({
  visible,
  currentProjectId,
  onClose,
}: {
  visible: boolean;
  currentProjectId: Id<"projects">;
  onClose: () => void;
}) {
  const groups = useQuery(api.projects.listMine);
  const router = useRouter();
  const t = useTheme();

  function selectGroup(id: Id<"projects">) {
    onClose();
    if (id === currentProjectId) {
      return;
    }
    // Replace (not push) so switching is lateral and the stack never grows.
    router.replace(`/${id}/lists`);
  }

  function manageGroups() {
    onClose();
    router.push("/projects");
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        Switch group
      </Txt>
      {groups === undefined ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ maxHeight: 320 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {groups.map((group) => {
            const active = group._id === currentProjectId;
            return (
              <Card key={group._id} onPress={() => selectGroup(group._id)}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Txt
                    weight={active ? "700" : "400"}
                    style={{ flex: 1, color: active ? t.primary : t.text }}
                  >
                    {group.name}
                  </Txt>
                  {active && <Check color={t.primary} size={18} />}
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
      <Button title="Manage groups" variant="ghost" onPress={manageGroups} />
    </Sheet>
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
        New list
      </Txt>
      <Field placeholder="Name" value={name} onChangeText={setName} autoFocus />
      <Field
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />
      {templates && templates.length > 0 ? (
        <>
          <Txt muted size={13}>
            Include templates
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
        title={busy ? "Creating…" : "Create list"}
        disabled={busy || name.trim().length === 0}
        onPress={create}
      />
    </Sheet>
  );
}
