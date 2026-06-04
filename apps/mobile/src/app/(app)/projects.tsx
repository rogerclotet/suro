import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { FlatList } from "react-native";
import { useTranslations } from "@/i18n";
import { Card, Loading, Screen, Txt } from "@/ui";

export default function Projects() {
  const projects = useQuery(api.projects.listMine);
  const router = useRouter();
  const t = useTranslations("mobile.groups");

  return (
    <Screen>
      <Stack.Screen options={{ title: t("title") }} />
      {projects === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(project) => project._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <Txt muted style={{ padding: 16 }}>
              {t("empty")}
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
