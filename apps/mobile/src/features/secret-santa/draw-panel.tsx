import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { drawProblem } from "domain/secret-santa";
import { TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import { useTranslations } from "@/i18n";
import { Button, Txt } from "@/ui";
import { secretSantaErrorMessage } from "./errors";
import { StatusLine } from "./layout";
import type { SecretSanta } from "./types";

/**
 * The organizer's last step. The draw is checked here with the same rule the
 * server applies, so an impossible one is explained instead of attempted.
 */
export function DrawPanel({ secretSanta }: { secretSanta: SecretSanta }) {
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const draw = useMutation(api.secretSantas.draw);
  const [busy, setBusy] = useState(false);
  const problem = drawProblem(
    secretSanta.participants.map((p) => p.userId),
    secretSanta.exclusions,
  );
  const blocked =
    problem === "tooFewParticipants"
      ? tSanta("validationMinParticipants")
      : problem === "exclusions"
        ? tSanta("drawBlockedByExclusions")
        : null;

  function run() {
    setBusy(true);
    draw({ secretSantaId: secretSanta._id })
      .catch((error: unknown) =>
        Alert.alert(
          secretSantaErrorMessage(error, tSanta) ?? tSanta("drawError"),
        ),
      )
      .finally(() => setBusy(false));
  }

  function confirm() {
    Alert.alert(tSanta("drawTitle"), tSanta("drawDescription"), [
      { text: tc("cancel"), style: "cancel" },
      { text: tSanta("drawAction"), onPress: run },
    ]);
  }

  return (
    <View style={{ gap: 12 }}>
      {blocked ? (
        <StatusLine icon={TriangleAlert} tone="warning" text={blocked} />
      ) : (
        <Txt muted size={14}>
          {tSanta("drawHint")}
        </Txt>
      )}
      <Button
        title={busy ? tSanta("drawRunning") : tSanta("drawAction")}
        disabled={busy || blocked !== null}
        onPress={confirm}
      />
    </View>
  );
}
