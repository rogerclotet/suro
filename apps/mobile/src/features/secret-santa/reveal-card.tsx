import { Gift } from "lucide-react-native";
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
 * A gift card that flips to show who the participant drew. The faces
 * swap at the edge-on midpoint instead of relying on `backfaceVisibility`,
 * which is unreliable for rotated views on Android.
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
      style={{ alignSelf: "center", paddingVertical: 8 }}
    >
      <Animated.View
        style={{
          width: CARD_WIDTH,
          aspectRatio: 3 / 4,
          transform: [{ perspective: 1000 }, { rotateY }],
        }}
      >
        {/* Each face mounts with its own fill: Android drops the corner
            radius when a mounted view's background color changes. */}
        <View
          key={revealed ? "front" : "back"}
          style={{
            flex: 1,
            borderRadius: 20,
            borderWidth: revealed ? 1 : 0,
            borderColor: t.border,
            backgroundColor: revealed ? t.card : t.primary,
            alignItems: "center",
            justifyContent: "space-evenly",
            padding: 16,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
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
                size={120}
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
                  position: "absolute",
                  top: 10,
                  right: 10,
                  bottom: 10,
                  left: 10,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: `${t.onPrimary}59`,
                }}
              />
              <Gift color={t.onPrimary} size={84} strokeWidth={1.5} />
              <Txt
                size={15}
                style={{ color: t.onPrimary, textAlign: "center" }}
              >
                {tSanta("tapToReveal")}
              </Txt>
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
