import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

/** A tonal status line: where the Secret Santa stands, or what blocks it. */
export function Notice({
  icon: Icon,
  text,
  tone = "info",
}: {
  icon: LucideIcon;
  text: string;
  tone?: "info" | "warning";
}) {
  const t = useTheme();
  const warning = tone === "warning";
  return (
    <View
      accessibilityRole={warning ? "alert" : undefined}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: warning ? t.danger : t.border,
        backgroundColor: warning ? `${t.danger}14` : t.navBar,
      }}
    >
      <Icon color={warning ? t.danger : t.primary} size={20} />
      <Txt size={15} style={{ flex: 1, color: warning ? t.danger : t.text }}>
        {text}
      </Txt>
    </View>
  );
}
