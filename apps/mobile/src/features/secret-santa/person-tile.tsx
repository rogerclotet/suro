import { Check } from "lucide-react-native";
import { View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import type { Person } from "./types";

// Fixed tile width: percentage widths inside a wrapping row overflow on Android.
export const PERSON_TILE_WIDTH = 72;
const AVATAR_SIZE = 48;
const NAME_HEIGHT = 32;

/** An avatar over a two-line name, for participant grids and pickers. */
export function PersonTile({
  person,
  selected = false,
  dimmed = false,
}: {
  person: Pick<Person, "name" | "image" | "avatarColor">;
  selected?: boolean;
  /** Recede a person who can't be picked right now. */
  dimmed?: boolean;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  return (
    <View
      style={{
        width: PERSON_TILE_WIDTH,
        alignItems: "center",
        gap: 6,
        opacity: dimmed ? 0.35 : 1,
      }}
    >
      <View
        style={{
          padding: 2,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: selected ? t.primary : "transparent",
        }}
      >
        <Avatar
          kind="user"
          name={person.name}
          image={person.image}
          color={person.avatarColor}
          size={AVATAR_SIZE}
        />
        {selected ? (
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: t.bg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: t.primary,
            }}
          >
            <Check color={t.onPrimary} size={12} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      {/* A fixed two-line slot keeps rows level when some names wrap. */}
      <View style={{ height: NAME_HEIGHT, justifyContent: "flex-start" }}>
        <Txt
          size={12}
          numberOfLines={2}
          weight={selected ? "700" : "400"}
          style={{
            textAlign: "center",
            color: selected ? t.primary : t.text,
          }}
        >
          {person.name ?? tSanta("unnamedMember")}
        </Txt>
      </View>
    </View>
  );
}
