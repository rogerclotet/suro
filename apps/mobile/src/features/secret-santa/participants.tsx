import { View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import { SectionLabel } from "./layout";
import { PersonTile } from "./person-tile";
import type { Person } from "./types";

const STACK_LIMIT = 6;
const STACK_AVATAR = 32;

/** Everyone taking part, as a grid of avatars. */
export function ParticipantGrid({ participants }: { participants: Person[] }) {
  const tSanta = useTranslations("secretSanta");
  return (
    <View style={{ gap: 12 }}>
      <SectionLabel
        title={tSanta("participants")}
        count={participants.length}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
        {participants.map((person) => (
          <PersonTile key={person.userId} person={person} />
        ))}
      </View>
    </View>
  );
}

/** A compact, overlapping row of participant avatars once the draw is done. */
export function ParticipantStack({ participants }: { participants: Person[] }) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  const shown = participants.slice(0, STACK_LIMIT);
  const hidden = participants.length - shown.length;
  return (
    <View
      accessible
      accessibilityLabel={tSanta("participantsCount", {
        count: participants.length,
      })}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View style={{ flexDirection: "row" }}>
        {shown.map((person, index) => (
          <View
            key={person.userId}
            style={{
              marginLeft: index === 0 ? 0 : -10,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: t.bg,
            }}
          >
            <Avatar
              kind="user"
              name={person.name}
              image={person.image}
              color={person.avatarColor}
              size={STACK_AVATAR}
            />
          </View>
        ))}
        {hidden > 0 ? (
          <View
            style={{
              marginLeft: -10,
              width: STACK_AVATAR + 4,
              height: STACK_AVATAR + 4,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: t.bg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: t.navBar,
            }}
          >
            <Txt size={12} weight="700" style={{ color: t.primary }}>
              {`+${hidden}`}
            </Txt>
          </View>
        ) : null}
      </View>
      <Txt muted size={14} style={{ flex: 1 }}>
        {tSanta("participantsCount", { count: participants.length })}
      </Txt>
    </View>
  );
}
