import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { maxExclusionSize } from "domain/secret-santa";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Sheet, Txt } from "@/ui";
import { secretSantaErrorMessage } from "./errors";
import { PersonTile } from "./person-tile";
import type { SecretSanta } from "./types";

/** Pick participants who must not draw each other. */
export function ExclusionSheet({
  visible,
  secretSanta,
  onClose,
}: {
  visible: boolean;
  secretSanta: SecretSanta;
  onClose: () => void;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const addExclusion = useMutation(api.secretSantas.addExclusion);
  const [selected, setSelected] = useState<Id<"users">[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const limit = maxExclusionSize(secretSanta.participants.length);

  useEffect(() => {
    if (!visible) return;
    setSelected([]);
    setError(null);
  }, [visible]);

  function toggle(userId: Id<"users">) {
    setError(null);
    if (selected.includes(userId)) {
      setSelected(selected.filter((id) => id !== userId));
    } else if (selected.length < limit) {
      setSelected([...selected, userId]);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      await addExclusion({ secretSantaId: secretSanta._id, userIds: selected });
      onClose();
    } catch (caught) {
      setError(
        secretSantaErrorMessage(caught, tSanta) ??
          tSanta("exclusionCreateError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tSanta("exclusionCreateTitle")}
      </Txt>
      <Txt muted size={14}>
        {tSanta("exclusionCreateDescription", { count: limit })}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {secretSanta.participants.map((person) => {
          const on = selected.includes(person.userId);
          return (
            <Pressable
              key={person.userId}
              onPress={() => toggle(person.userId)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={person.name ?? tSanta("unnamedMember")}
            >
              <PersonTile person={person} selected={on} />
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Txt size={13} style={{ color: t.danger }}>
          {error}
        </Txt>
      ) : null}
      <Button
        title={busy ? tc("saving") : tSanta("exclude")}
        disabled={busy || selected.length < 2}
        onPress={submit}
      />
    </Sheet>
  );
}
