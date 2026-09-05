import { api } from "backend/convex/_generated/api";
import { Stack, useRouter } from "expo-router";
import { MessageSquarePlus } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Avatar, HEADER_AVATAR_SIZE } from "@/components/avatar";
import { GroupsScreenContent } from "@/components/group-switcher";
import { useTranslations } from "@/i18n";
import { useFeedback } from "@/lib/feedback-state";
import { usePersistentQuery } from "@/lib/offline";
import { useTheme } from "@/theme";
import { HEADER_BUTTON_INSET, Screen, Txt } from "@/ui";

export default function GroupsScreen() {
  const me = usePersistentQuery(api.users.me);
  const router = useRouter();
  const tProfile = useTranslations("mobile.profile");
  const tNav = useTranslations("nav");
  const t = useTheme();
  const { openFeedback } = useFeedback();
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Suro",
          headerBackVisible: false,
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginRight:
                  Platform.OS === "android" ? HEADER_BUTTON_INSET : 0,
              }}
            >
              <Pressable
                onPress={openFeedback}
                accessibilityRole="button"
                accessibilityLabel={tNav("feedback")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  minHeight: 44,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: t.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <MessageSquarePlus color={t.muted} size={18} />
                <Txt muted size={13}>
                  {tNav("feedback")}
                </Txt>
              </Pressable>
              <Avatar
                kind="user"
                name={me?.name}
                image={me?.customImage ?? me?.image}
                color={me?.avatarColor}
                size={HEADER_AVATAR_SIZE}
                accessibilityLabel={tProfile("title")}
                onPress={() => router.push("/profile")}
              />
            </View>
          ),
        }}
      />
      <GroupsScreenContent />
    </Screen>
  );
}
