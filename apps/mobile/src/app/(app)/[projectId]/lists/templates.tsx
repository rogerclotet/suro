import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { Button, Card, Loading, Screen, Txt } from "@/ui";

type Template = FunctionReturnType<typeof api.templates.listByProject>[number];

export default function Templates() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const pid = projectId as Id<"projects">;
  const templates = useQuery(api.templates.listByProject, { projectId: pid });
  const createList = useMutation(api.lists.create);
  const removeTemplate = useMutation(api.templates.remove);
  const router = useRouter();

  async function createFromTemplate(template: Template) {
    const listId = await createList({
      projectId: pid,
      name: template.name,
      templateIds: [template._id],
    });
    router.replace(`/${pid}/lists/${listId}`);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Templates" }} />
      {templates === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(template) => template._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <Txt muted style={{ padding: 8 }}>
              No templates yet.
            </Txt>
          }
          renderItem={({ item }) => (
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Txt size={17} weight="700">
                    {item.name}
                  </Txt>
                  <Txt muted size={13}>
                    {item.items.length} item{item.items.length === 1 ? "" : "s"}
                  </Txt>
                </View>
                <Pressable
                  onPress={() => void removeTemplate({ templateId: item._id })}
                  hitSlop={8}
                  style={{ padding: 6 }}
                >
                  <Txt muted size={18}>
                    ✕
                  </Txt>
                </Pressable>
              </View>
              <View style={{ marginTop: 12 }}>
                <Button
                  title="Create list from template"
                  onPress={() => createFromTemplate(item)}
                />
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
