import { ChevronRight, Lightbulb } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

/**
 * Opens the participant's own wish list, styled like the Lists screen's
 * "My tasks" entry since it is the same kind of hop into a sub-screen.
 */
export function MyIdeasRow({
  count,
  onPress,
}: {
  /** `undefined` while the ideas load. */
  count: number | undefined;
  onPress: () => void;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tSanta("myIdeasAction")}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: pressed ? t.border : t.card,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${t.primary}1a`,
        }}
      >
        <Lightbulb color={t.primary} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={15} weight="700">
          {tSanta("myIdeasAction")}
        </Txt>
        {count === undefined ? null : (
          <Txt muted size={13}>
            {tSanta("myIdeasSummary", { count })}
          </Txt>
        )}
      </View>
      <ChevronRight color={t.muted} size={18} />
    </Pressable>
  );
}
