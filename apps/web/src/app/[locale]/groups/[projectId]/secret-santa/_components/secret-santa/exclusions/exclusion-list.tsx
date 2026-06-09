import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { posthog } from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import type { ExclusionData, SecretSanta } from "@/app/_data/secret-santa";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { deleteExclusion } from "@/server/secret-santa";
import Participant from "../setup/participant";

export default function ExclusionList({
  secretSanta,
}: {
  secretSanta: SecretSanta;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {secretSanta.exclusions.map((exclusion: ExclusionData) => (
        <Exclusion
          key={exclusion.join("-")}
          secretSanta={secretSanta}
          exclusion={exclusion}
        />
      ))}
    </ul>
  );
}

function Exclusion({
  secretSanta,
  exclusion,
}: {
  secretSanta: SecretSanta;
  exclusion: ExclusionData;
}) {
  const { participants } = secretSanta;
  const [isDeletingEnabled, setIsDeletingEnabled] = useState(false);
  const { data: session } = useSession();
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  function handleEnableDeleteButton() {
    setIsDeletingEnabled(true);
  }

  function handleDisableDeleteButton() {
    setIsDeletingEnabled(false);
  }

  async function handleDelete() {
    try {
      await deleteExclusion(secretSanta, exclusion);
      toast.success(t("exclusionDeleteSuccess"));
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "delete_exclusion",
        projectId: secretSanta.projectId,
        secretSantaId: secretSanta.id,
        exclusion: exclusion,
      });
      toast.error(t("exclusionDeleteError"));
    }
  }

  return (
    <li
      key={exclusion.join("-")}
      className={cn(
        "relative flex flex-row flex-wrap gap-1 rounded-xl border-2 border-destructive/20 bg-destructive/5 p-1",
        isDeletingEnabled && "border-destructive/30 bg-destructive/10",
      )}
      onMouseOver={handleEnableDeleteButton}
      onMouseLeave={handleDisableDeleteButton}
      onFocus={handleEnableDeleteButton}
      onBlur={handleDisableDeleteButton}
    >
      {exclusion.map((participant) => {
        const user = participants.find((p) => p.id === participant)?.user;
        if (!user) {
          return null;
        }

        return (
          <Participant
            key={participant}
            user={user}
            className="pointer-events-none h-24 bg-accent/10"
            nameSize="xs"
          />
        );
      })}

      <ModalAction
        title={t("exclusionDeleteTitle", {
          names: exclusion
            .map(
              (participant) =>
                participants.find((p) => p.id === participant)?.user.name,
            )
            .join(", "),
        })}
        description={t("exclusionDeleteDescription")}
        actionText={tCommon("delete")}
        onAction={handleDelete}
        trigger={
          <Button
            variant="ghostDestructive"
            size="icon"
            className={cn(
              "absolute top-1.5 right-1.5 hidden size-6",
              isDeletingEnabled && "block",
            )}
            disabled={!isDeletingEnabled}
          >
            <div className="flex items-center justify-center">
              <Trash2Icon className="size-4" />
            </div>
          </Button>
        }
      />
    </li>
  );
}
