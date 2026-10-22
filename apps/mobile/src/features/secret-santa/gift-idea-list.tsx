import { giftLinkLabel } from "domain/secret-santa";
import { ExternalLink } from "lucide-react-native";
import type { ReactNode } from "react";
import { Linking, Pressable, View } from "react-native";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import { Divider } from "./layout";
import type { GiftIdea } from "./types";

/** Gift ideas as flat rows split by dividers, like the app's other lists. */
export function GiftIdeaList({
  giftIdeas,
  onPress,
}: {
  giftIdeas: GiftIdea[];
  /** Makes each row editable. */
  onPress?: (giftIdea: GiftIdea) => void;
}) {
  return (
    <View>
      {giftIdeas.map((giftIdea, index) => (
        <View key={giftIdea._id}>
          {index > 0 ? <Divider /> : null}
          <GiftIdeaRow
            giftIdea={giftIdea}
            onPress={onPress ? () => onPress(giftIdea) : undefined}
          />
        </View>
      ))}
    </View>
  );
}

/** A gift idea's name, notes and link. */
function GiftIdeaRow({
  giftIdea,
  onPress,
}: {
  giftIdea: GiftIdea;
  onPress?: () => void;
}) {
  const t = useTheme();
  const { url } = giftIdea;
  const content: ReactNode = (
    <View style={{ gap: 2 }}>
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
            marginTop: 6,
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
  );
  if (!onPress) {
    return <View style={{ paddingVertical: 12 }}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={giftIdea.name}
      style={({ pressed }) => ({
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
