import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, View } from "react-native";
import { useTheme } from "@/theme";
import { Button, Field, Loading, Screen, Txt } from "@/ui";

type ListsResult = FunctionReturnType<typeof api.lists.listByProject>;
type ListWithItems = ListsResult[number];

function isCompleted(list: ListWithItems) {
  return list.items.length > 0 && list.items.every((item) => item.completed);
}

export default function ListsOverview() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const pid = projectId as Id<"projects">;
  const lists = useQuery(api.lists.listByProject, { projectId: pid });
  const createList = useMutation(api.lists.create);
  const toggleFavorite = useMutation(api.lists.toggleFavorite);
  const router = useRouter();
  const t = useTheme();
  const [name, setName] = useState("");

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

  async function addList() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setName("");
    await createList({ projectId: pid, name: trimmed });
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Lists" }} />
      {lists === undefined ? (
        <Loading />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View style={{ flexDirection: "row", gap: 8, paddingBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Field
                  placeholder="New list…"
                  value={name}
                  onChangeText={setName}
                  onSubmitEditing={addList}
                  returnKeyType="done"
                />
              </View>
              <Button title="Add" onPress={addList} />
            </View>
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
    </Screen>
  );
}
