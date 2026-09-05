import type { LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { UnreadBadge } from "@/components/unread-badge";
import { useTranslations } from "@/i18n";
import { HOME_SECTIONS } from "@/lib/home-sections";
import { unreadCount } from "@/lib/notification-routing";
import {
  useOpenNotificationSection,
  useUnreadNotifications,
} from "@/lib/notifications";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

function SectionChip({
  label,
  icon: Icon,
  onPress,
  count,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  count: number;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.card,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon color={t.primary} size={14} />
      <Txt weight="700" size={13} numberOfLines={1}>
        {label}
      </Txt>
      <UnreadBadge count={count} />
    </Pressable>
  );
}

/** Compact section shortcuts below the home date header. Wraps to a second row. */
export function HomeSectionChips() {
  const pid = useProjectId();
  const openSection = useOpenNotificationSection(pid);
  const unread = useUnreadNotifications();
  const tNav = useTranslations("nav");

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {HOME_SECTIONS.map((section) => (
        <SectionChip
          key={section.key}
          label={tNav(section.key)}
          icon={section.icon}
          count={unreadCount(unread, pid, section.key)}
          onPress={() =>
            openSection(section.key, `/${pid}/home/${section.key}`)
          }
        />
      ))}
    </View>
  );
}
