import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { FlatList, Pressable } from "react-native";
import { useTheme } from "@/theme";
import { Card, Loading, Screen, Txt } from "@/ui";

export default function Projects() {
  const projects = useQuery(api.projects.listMine);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const t = useTheme();

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Groups",
          headerRight: () => (
            <Pressable onPress={() => void signOut()}>
              <Txt style={{ color: t.primary }}>Sign out</Txt>
            </Pressable>
          ),
        }}
      />
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
