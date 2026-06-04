import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Field, Loading, Screen, Txt } from "@/ui";

export default function Categories() {
  const pid = useProjectId();
  const categories = useQuery(api.categories.listWithCounts, {
    projectId: pid,
  });
  const create = useMutation(api.categories.create);
  const update = useMutation(api.categories.update);
  const remove = useMutation(api.categories.remove);
  const t = useTheme();

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);
  const [draft, setDraft] = useState("");

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setName("");
    await create({ projectId: pid, name: trimmed });
  }

  async function saveEdit(categoryId: Id<"categories">) {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    setEditingId(null);
    await update({ categoryId, name: trimmed });
  }

  function confirmDelete(categoryId: Id<"categories">, categoryName: string) {
    Alert.alert(
      "Delete category",
      `Delete "${categoryName}"? This can't be undone, and its items will become uncategorized.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void remove({ categoryId }),
        },
      ],
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Categories" }} />
      {categories === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(category) => category._id}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ flexDirection: "row", gap: 8, paddingBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Field
                  placeholder="New category…"
                  value={name}
                  onChangeText={setName}
                  onSubmitEditing={add}
                  returnKeyType="done"
                />
              </View>
              <Button title="Add" onPress={add} />
            </View>
          }
          ListEmptyComponent={
            <Txt muted style={{ padding: 8 }}>
              No categories yet.
            </Txt>
          }
          renderItem={({ item }) =>
            editingId === item._id ? (
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  alignItems: "center",
                  paddingVertical: 6,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Field
                    value={draft}
                    onChangeText={setDraft}
                    autoFocus
                    onSubmitEditing={() => saveEdit(item._id)}
                    returnKeyType="done"
                  />
                </View>
                <Button title="Save" onPress={() => saveEdit(item._id)} />
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => {
                    setEditingId(item._id);
                    setDraft(item.name);
                  }}
                >
                  <Txt size={16}>{item.name}</Txt>
                  <Txt muted size={13}>
                    {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
                  </Txt>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(item._id, item.name)}
                  hitSlop={8}
                  style={{ padding: 6 }}
                >
                  <Txt muted size={18}>
                    ✕
                  </Txt>
                </Pressable>
              </View>
            )
          }
        />
      )}
    </Screen>
  );
}
