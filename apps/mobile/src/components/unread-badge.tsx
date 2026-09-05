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
