import { getTranslations } from "next-intl/server";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { Separator } from "@/components/ui/separator";
import { getAssignment } from "@/server/secret-santa";
import SecretSantaInfo from "../info/secret-santa-info";
import Assignment from "./assignment";

export default async function SecretSantaStarted({
  secretSanta,
}: {
  secretSanta: SecretSanta;
}) {
  const assignment = await getAssignment(secretSanta.id);
  const t = await getTranslations("secretSanta");

  if (!assignment) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SecretSantaInfo secretSanta={secretSanta} />

      <Separator />

      <h3 className="font-semibold text-lg">
        {t("yourMatch", { name: assignment.user.name ?? "" })}
      </h3>

      <Assignment assignment={assignment} />
    </div>
  );
}
