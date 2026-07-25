import { Stack } from "expo-router";
import { GroupsScreenContent } from "@/components/group-switcher";
import { useTranslations } from "@/i18n";
import { Screen } from "@/ui";

export default function GroupsScreen() {
  const tNav = useTranslations("nav");

  return (
    <Screen>
      <Stack.Screen options={{ title: tNav("groups") }} />
      <GroupsScreenContent />
    </Screen>
  );
}
