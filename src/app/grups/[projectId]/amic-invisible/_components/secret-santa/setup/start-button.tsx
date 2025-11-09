"use client";

import { PlayIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import ModalAction from "@/components/ui/modal-action";
import { startSecretSanta } from "@/server/secret-santa";

export default function StartButton({
  secretSanta,
}: {
  secretSanta: SecretSanta;
}) {
  const { data: session } = useSession();
  const { isAdmin } = useProjects();
  if (!isAdmin) {
    return null;
  }

  async function handleStart() {
    try {
      await startSecretSanta(secretSanta);
      toast.success("S'ha realitzat el sorteig correctament");
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "start_secret_santa",
        projectId: secretSanta.projectId,
      });
      toast.error(
        "No s'ha pogut realitzar el sorteig, torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalAction
      title="Realitzar sorteig"
      description="Estàs segur que vols realitzar el sorteig? Aquesta acció no es pot desfer."
      actionText="Realitzar sorteig"
      onAction={handleStart}
      trigger={<Action icon={PlayIcon} label="Realitzar sorteig" />}
    />
  );
}
