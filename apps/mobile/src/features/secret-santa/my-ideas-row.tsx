import { ChevronRight, Lightbulb } from "lucide-react-native";
import { View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Card, Txt } from "@/ui";

/** Opens the participant's own wish list, with how many ideas it holds. */
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
    <Card onPress={onPress} accessibilityLabel={tSanta("myIdeasAction")}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${t.marker}26`,
          }}
        >
          <Lightbulb color={t.marker} size={20} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={16} weight="700" display>
            {tSanta("myIdeasAction")}
          </Txt>
          <Txt muted size={13}>
            {count === undefined
              ? tSanta("ideasIntro")
              : tSanta("myIdeasSummary", { count })}
          </Txt>
        </View>
        <ChevronRight color={t.muted} size={20} />
      </View>
    </Card>
  );
}
