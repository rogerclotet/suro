import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { Pressable } from "react-native";
import { Avatar, HEADER_AVATAR_SIZE } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { HEADER_BUTTON_INSET } from "@/ui";

/**
 * Header-right profile badge that opens the profile screen. The `filled`
 * variant (Android) is the user's Catppuccin avatar; the `glass` variant (iOS)
 * is a tinted person icon in the native Liquid Glass capsule.
 */
export function ProfileBadge({
  variant = "filled",
}: {
  variant?: "filled" | "glass";
}) {
  const user = useQuery(api.users.me);
  const router = useRouter();
  const t = useTheme();
  const tNav = useTranslations("nav");

  if (variant === "glass") {
    return (
      <Pressable
        onPress={() => router.push("/profile")}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tNav("profile")}
      >
        <User color={t.primary} size={22} />
      </Pressable>
    );
  }

  return (
    <Avatar
      name={user?.name}
      image={user?.customImage ?? user?.image}
      color={user?.avatarColor}
      size={HEADER_AVATAR_SIZE}
      onPress={() => router.push("/profile")}
      accessibilityLabel={tNav("profile")}
      style={{ marginHorizontal: HEADER_BUTTON_INSET }}
    />
  );
}
