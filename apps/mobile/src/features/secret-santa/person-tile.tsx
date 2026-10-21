import { View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import type { Person } from "./types";

// Fixed tile width: percentage widths inside a wrapping row overflow on Android.
export const PERSON_TILE_WIDTH = 76;

/** Avatar over a two-line name, for participant grids. */
export function PersonTile({
  person,
  selected = false,
}: {
  person: Pick<Person, "name" | "image" | "avatarColor">;
  selected?: boolean;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  return (
    <View
      style={{
        width: PERSON_TILE_WIDTH,
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? t.primary : t.border,
        backgroundColor: selected ? `${t.primary}1f` : t.card,
      }}
    >
      <Avatar
        kind="user"
        name={person.name}
        image={person.image}
        color={person.avatarColor}
        size={44}
      />
      <Txt
        size={12}
        numberOfLines={2}
        style={{ textAlign: "center", paddingHorizontal: 4 }}
      >
        {person.name ?? tSanta("unnamedMember")}
      </Txt>
    </View>
  );
}
