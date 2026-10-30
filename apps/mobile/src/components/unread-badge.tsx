import { View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

export function UnreadBadge({ count }: { count: number }) {
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  if (!count) return null;
  return (
    <View
      accessibilityLabel={tr("unreadCount", { count })}
      style={{
        minWidth: 22,
        height: 22,
        paddingHorizontal: 6,
        borderRadius: 11,
        backgroundColor: t.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt size={12} weight="700" style={{ color: t.onPrimary }}>
        {count > 99 ? "99+" : count}
      </Txt>
    </View>
  );
}

/** Marks a row whose item changed since the user last opened it. */
export function UnreadDot({ count }: { count: number }) {
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  if (!count) return null;
  return (
    <View
      accessible
      accessibilityLabel={tr("unreadCount", { count })}
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: t.primary,
        flexShrink: 0,
      }}
    />
  );
}
