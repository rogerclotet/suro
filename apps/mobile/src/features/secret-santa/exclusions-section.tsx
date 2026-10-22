import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Plus, Trash2 } from "lucide-react-native";
import { Alert, Pressable, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Card, Txt } from "@/ui";
import { SectionTitle } from "./participants";
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
    <View style={{ gap: 10 }}>
      <SectionTitle
        title={tSanta("exclusionsTitle")}
        count={
          secretSanta.exclusions.length > 0
            ? secretSanta.exclusions.length
            : undefined
        }
      />
      <Txt muted size={14}>
        {tSanta("exclusionsDescription")}
      </Txt>
      {secretSanta.exclusions.map((exclusion) => {
        const people = exclusion.map((id) =>
          secretSanta.participants.find((person) => person.userId === id),
        );
        const names = people
          .map((person) => person?.name ?? tSanta("unnamedMember"))
          .join(", ");
        return (
          <ExclusionRow
            key={exclusion.join("-")}
            people={people}
            names={names}
            onRemove={
              editable ? () => confirmRemove(exclusion, names) : undefined
            }
          />
        );
      })}
      {onAdd ? (
        <AddButton label={tSanta("exclusionCreateAction")} onPress={onAdd} />
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
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flexDirection: "row" }}>
          {people.map((person, index) => (
            <View
              key={person?.userId ?? index}
              style={{
                marginLeft: index === 0 ? 0 : -10,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: t.card,
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
    </Card>
  );
}

/** A dashed, full-width prompt to add another item to a section. */
function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: t.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Plus color={t.primary} size={18} />
      <Txt size={15} display style={{ color: t.primary }}>
        {label}
      </Txt>
    </Pressable>
  );
}
