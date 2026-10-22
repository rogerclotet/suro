import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Plus, Trash2 } from "lucide-react-native";
import { Alert, Pressable, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import { Divider, SectionLabel } from "./layout";
import type { Person, SecretSanta } from "./types";

/**
 * Groups who must not draw each other. The organizer edits them until the
 * draw; everyone else only sees them.
 */
export function ExclusionsSection({
  secretSanta,
  editable,
  onAdd,
}: {
  secretSanta: SecretSanta;
  /** Whether stored groups can be removed. */
  editable: boolean;
  /** Absent when no new group fits, e.g. below four participants. */
  onAdd?: () => void;
}) {
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const removeExclusion = useMutation(api.secretSantas.removeExclusion);
  const { exclusions } = secretSanta;

  function confirmRemove(exclusion: Id<"users">[], names: string) {
    Alert.alert(
      tSanta("exclusionDeleteTitle", { names }),
      tSanta("exclusionDeleteDescription"),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => {
            removeExclusion({
              secretSantaId: secretSanta._id,
              userIds: exclusion,
            }).catch(() => Alert.alert(tSanta("exclusionDeleteError")));
          },
        },
      ],
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <SectionLabel
        title={tSanta("exclusionsTitle")}
        count={exclusions.length > 0 ? exclusions.length : undefined}
      />
      <Txt muted size={13}>
        {tSanta("exclusionsDescription")}
      </Txt>
      {exclusions.length > 0 ? (
        <View>
          {exclusions.map((exclusion, index) => {
            const people = exclusion.map((id) =>
              secretSanta.participants.find((person) => person.userId === id),
            );
            const names = people
              .map((person) => person?.name ?? tSanta("unnamedMember"))
              .join(", ");
            return (
              <View key={exclusion.join("-")}>
                {index > 0 ? <Divider /> : null}
                <ExclusionRow
                  people={people}
                  names={names}
                  onRemove={
                    editable ? () => confirmRemove(exclusion, names) : undefined
                  }
                />
              </View>
            );
          })}
        </View>
      ) : null}
      {onAdd ? (
        <AddChip label={tSanta("exclusionCreateAction")} onPress={onAdd} />
      ) : null}
    </View>
  );
}

function ExclusionRow({
  people,
  names,
  onRemove,
}: {
  people: (Person | undefined)[];
  names: string;
  onRemove?: () => void;
}) {
  const t = useTheme();
  const tc = useTranslations("mobile.common");
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {people.map((person, index) => (
          <View
            key={person?.userId ?? index}
            style={{
              marginLeft: index === 0 ? 0 : -10,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: t.bg,
            }}
          >
            <Avatar
              kind="user"
              name={person?.name}
              image={person?.image}
              color={person?.avatarColor}
              size={30}
            />
          </View>
        ))}
      </View>
      <Txt style={{ flex: 1 }} numberOfLines={2}>
        {names}
      </Txt>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`${tc("delete")}: ${names}`}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Trash2 color={t.danger} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** The event screen's dashed "add" prompt. */
function AddChip({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", marginTop: 4 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: t.border,
          borderRadius: 999,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Plus color={t.muted} size={14} />
        <Txt muted size={13}>
          {label}
        </Txt>
      </Pressable>
    </View>
  );
}
