import { Check } from "lucide-react-native";
import { View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import type { Person } from "./types";

// Fixed tile width: percentage widths inside a wrapping row overflow on Android.
export const PERSON_TILE_WIDTH = 76;
const NAME_HEIGHT = 32;

/** Avatar over a two-line name, for participant grids. */
export function PersonTile({
  person,
  selected = false,
  dimmed = false,
}: {
  person: Pick<Person, "name" | "image" | "avatarColor">;
  selected?: boolean;
  /** Recede a tile that can't be picked right now. */
  dimmed?: boolean;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  return (
    <View
      // Android drops the corner radius when a mounted view's background
      // changes, so a selection change remounts the tile instead.
      key={selected ? "selected" : "plain"}
      style={{
        width: PERSON_TILE_WIDTH,
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? t.primary : t.border,
        backgroundColor: selected ? `${t.primary}1f` : t.card,
        opacity: dimmed ? 0.4 : 1,
      }}
    >
      <View>
        <Avatar
          kind="user"
          name={person.name}
          image={person.image}
          color={person.avatarColor}
          size={44}
        />
        {selected ? (
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -2,
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: t.card,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: t.primary,
            }}
          >
            <Check color={t.onPrimary} size={12} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      {/* A fixed two-line slot keeps tiles level when some names wrap. */}
      <View
        style={{
          height: NAME_HEIGHT,
          justifyContent: "center",
          paddingHorizontal: 4,
        }}
      >
        <Txt size={12} numberOfLines={2} style={{ textAlign: "center" }}>
          {person.name ?? tSanta("unnamedMember")}
        </Txt>
      </View>
    </View>
  );
}
