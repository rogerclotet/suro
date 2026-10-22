import { giftLinkLabel } from "domain/secret-santa";
import { ExternalLink, Pencil } from "lucide-react-native";
import { Linking, Pressable, View } from "react-native";
import { useTheme } from "@/theme";
import { Card, Txt } from "@/ui";
import type { GiftIdea } from "./types";

/** A gift idea's name, notes and link; `onPress` makes the card editable. */
export function GiftIdeaRow({
  giftIdea,
  onPress,
}: {
  giftIdea: GiftIdea;
  onPress?: () => void;
}) {
  const t = useTheme();
  const { url } = giftIdea;
  return (
    <Card onPress={onPress} accessibilityLabel={giftIdea.name}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={16} weight="700">
            {giftIdea.name}
          </Txt>
          {giftIdea.description ? (
            <Txt muted size={14}>
              {giftIdea.description}
            </Txt>
          ) : null}
          {url ? (
            <Pressable
              onPress={() => void Linking.openURL(url)}
              accessibilityRole="link"
              accessibilityHint={url}
              hitSlop={6}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 6,
                marginTop: 4,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: t.navBar,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <ExternalLink color={t.primary} size={14} />
              <Txt
                size={13}
                weight="700"
                numberOfLines={1}
                style={{ color: t.primary, flexShrink: 1 }}
              >
                {giftLinkLabel(url)}
              </Txt>
            </Pressable>
          ) : null}
        </View>
        {onPress ? <Pencil color={t.muted} size={16} /> : null}
      </View>
    </Card>
  );
}
