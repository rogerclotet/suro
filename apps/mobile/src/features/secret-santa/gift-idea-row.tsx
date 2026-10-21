import { ExternalLink } from "lucide-react-native";
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
      <View style={{ gap: 4 }}>
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
            hitSlop={6}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ExternalLink color={t.primary} size={14} />
            <Txt
              size={13}
              numberOfLines={1}
              style={{ color: t.primary, flex: 1 }}
            >
              {url}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
