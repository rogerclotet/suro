import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { FlatList } from "react-native";
import { Card, Loading, Screen, Txt } from "@/ui";

export default function Projects() {
  const projects = useQuery(api.projects.listMine);
  const router = useRouter();

  return (
    <Screen>
      <Stack.Screen options={{ title: "Groups" }} />
      {projects === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(project) => project._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <Txt muted style={{ padding: 16 }}>
              No groups yet.
            </Txt>
          }
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/${item._id}/lists`)}>
              <Txt size={18} weight="700">
                {item.name}
              </Txt>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
