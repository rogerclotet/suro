import { BadgeQuestionMark } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import type { Person } from "./types";

const HALF_FLIP_MS = 220;
const CARD_WIDTH = 220;

/**
 * A face-down card that flips to show who the participant drew. The faces swap
 * at the edge-on midpoint instead of relying on `backfaceVisibility`, which is
 * unreliable for rotated views on Android.
 */
export function RevealCard({
  person,
  onRevealChange,
}: {
  person: Pick<Person, "name" | "image" | "avatarColor">;
  onRevealChange: (revealed: boolean) => void;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  const [revealed, setRevealed] = useState(false);
  const flipping = useRef(false);
  const rotation = useMemo(() => new Animated.Value(0), []);
  const rotateY = rotation.interpolate({
    inputRange: [-90, 90],
    outputRange: ["-90deg", "90deg"],
  });

  function flip() {
    if (flipping.current) return;
    flipping.current = true;
    Animated.timing(rotation, {
      toValue: 90,
      duration: HALF_FLIP_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      const next = !revealed;
      setRevealed(next);
      onRevealChange(next);
      rotation.setValue(-90);
      Animated.timing(rotation, {
        toValue: 0,
        duration: HALF_FLIP_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        flipping.current = false;
      });
    });
  }

  const name = person.name ?? tSanta("unnamedMember");

  return (
    <Pressable
      onPress={flip}
      accessibilityRole="button"
      accessibilityLabel={
        revealed ? tSanta("hideMatch") : tSanta("tapToReveal")
      }
      style={{ alignSelf: "center", paddingVertical: 16 }}
    >
      <Animated.View
        style={{
          width: CARD_WIDTH,
          aspectRatio: 3 / 4,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.card,
          alignItems: "center",
          justifyContent: "space-evenly",
          padding: 16,
          transform: [{ perspective: 1000 }, { rotateY }],
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        {revealed ? (
          <>
            <Avatar
              kind="user"
              name={person.name}
              image={person.image}
              color={person.avatarColor}
              size={128}
            />
            <Txt
              size={22}
              weight="700"
              numberOfLines={2}
              style={{ color: t.primary, textAlign: "center" }}
            >
              {name}
            </Txt>
          </>
        ) : (
          <>
            <View
              style={{
                width: 128,
                height: 128,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BadgeQuestionMark color={t.border} size={112} />
            </View>
            <Txt muted size={14} style={{ textAlign: "center" }}>
              {tSanta("tapToReveal")}
            </Txt>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}
