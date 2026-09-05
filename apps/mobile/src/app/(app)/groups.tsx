import { api } from "backend/convex/_generated/api";
import { Stack, useRouter } from "expo-router";
import { Platform } from "react-native";
import { Avatar, HEADER_AVATAR_SIZE } from "@/components/avatar";
import { GroupsScreenContent } from "@/components/group-switcher";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { HEADER_BUTTON_INSET, Screen } from "@/ui";

export default function GroupsScreen() {
  const me = usePersistentQuery(api.users.me);
  const router = useRouter();
  const tProfile = useTranslations("mobile.profile");
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Suro",
          headerBackVisible: false,
          headerRight: () => (
            <Avatar
              name={me?.name}
              image={me?.customImage ?? me?.image}
              color={me?.avatarColor}
              size={HEADER_AVATAR_SIZE}
              accessibilityLabel={tProfile("title")}
              onPress={() => router.push("/profile")}
              style={{
                marginRight:
                  Platform.OS === "android" ? HEADER_BUTTON_INSET : 0,
              }}
            />
          ),
        }}
      />
      <GroupsScreenContent />
    </Screen>
  );
}
