import { getTranslations } from "next-intl/server";
import type { SecretSanta as SecretSantaType } from "@/app/_data/secret-santa";
import { Separator } from "@/components/ui/separator";
import Exclusions from "../exclusions/exclusions";
import SecretSantaInfo from "../info/secret-santa-info";
import Participant from "./participant";
import StartButton from "./start-button";

export default async function SecretSantaSetup({
  secretSanta,
}: {
  secretSanta: SecretSantaType;
}) {
  const t = await getTranslations("secretSanta");

  return (
    <div className="space-y-4">
      <SecretSantaInfo secretSanta={secretSanta} />

      <Separator />

      <h3 className="font-semibold text-lg">{t("participants")}</h3>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
        {secretSanta.participants.map((participant) => (
          <Participant key={participant.id} user={participant.user} />
        ))}
      </div>

      {secretSanta.participants.length > 3 && (
        <Exclusions secretSanta={secretSanta} />
      )}

      <StartButton secretSanta={secretSanta} />
    </div>
  );
}
