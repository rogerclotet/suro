import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

/** An uppercase section label, as the Lists and Expenses screens use. */
export function SectionLabel({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <Txt muted size={12} style={{ letterSpacing: 1 }}>
      {count === undefined
        ? title.toUpperCase()
        : `${title.toUpperCase()} · ${count}`}
    </Txt>
  );
}

/** A hairline rule between the header and the content, or between rows. */
export function Divider({ hairline = false }: { hairline?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        height: hairline ? StyleSheet.hairlineWidth : 1,
        backgroundColor: t.border,
      }}
    />
  );
}

/** A plain status line: where the Secret Santa stands, or what blocks it. */
export function StatusLine({
  icon: Icon,
  text,
  tone = "info",
}: {
  icon: LucideIcon;
  text: string;
  tone?: "info" | "warning";
}) {
  const t = useTheme();
  const color = tone === "warning" ? t.danger : t.muted;
  return (
    <View
      accessibilityRole={tone === "warning" ? "alert" : undefined}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
    >
      <Icon color={color} size={18} style={{ marginTop: 1 }} />
      <Txt size={14} style={{ flex: 1, color }}>
        {text}
      </Txt>
    </View>
  );
}
