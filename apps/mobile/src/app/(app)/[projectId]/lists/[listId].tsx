import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, View } from "react-native";
import { useTheme } from "@/theme";
import { Button, Field, Loading, Screen, Txt } from "@/ui";

type ListResult = FunctionReturnType<typeof api.lists.get>;
type Item = ListResult["items"][number];

const UNCATEGORIZED = "Other";

function groupByCategory(items: Item[]) {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.category?.name ?? UNCATEGORIZED;
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
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const lid = listId as Id<"lists">;
  const list = useQuery(api.lists.get, { listId: lid });
  const createItem = useMutation(api.listItems.create);
  const removeItem = useMutation(api.listItems.remove);
  const updateItem = useMutation(api.listItems.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.lists.get, { listId: lid });
      if (!current) {
        return;
      }
      localStore.setQuery(
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
  const t = useTheme();
  const [name, setName] = useState("");

  const sections = useMemo(
    () => (list ? groupByCategory(list.items) : []),
    [list],
  );

  async function addItem() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setName("");
    await createItem({ listId: lid, name: trimmed });
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

  if (list === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: list.name }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ flexDirection: "row", gap: 8, paddingBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                placeholder="Add an item…"
                value={name}
                onChangeText={setName}
                onSubmitEditing={addItem}
                returnKeyType="done"
              />
            </View>
            <Button title="Add" onPress={addItem} />
          </View>
        }
        ListEmptyComponent={
          <Txt muted style={{ padding: 16 }}>
            No items yet.
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
                borderRadius: 13,
                borderWidth: 2,
                borderColor: item.completed ? t.primary : t.muted,
                backgroundColor: item.completed ? t.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.completed ? (
                <Txt size={15} style={{ color: t.onPrimary }}>
                  ✓
                </Txt>
              ) : null}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Txt size={16} muted={item.completed} strike={item.completed}>
                {item.name}
              </Txt>
              {item.details ? (
                <Txt muted size={13}>
                  {item.details}
                </Txt>
              ) : null}
            </View>
            <Pressable
              onPress={() => void removeItem({ itemId: item._id })}
              hitSlop={8}
              style={{ padding: 6 }}
            >
              <Txt muted size={18}>
                ✕
              </Txt>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
