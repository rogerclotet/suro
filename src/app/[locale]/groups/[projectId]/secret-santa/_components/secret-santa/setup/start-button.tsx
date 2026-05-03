"use client";

import { PlayIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("secretSanta");
  if (!isAdmin) {
    return null;
  }

  async function handleStart() {
    try {
      await startSecretSanta(secretSanta);
      toast.success(t("drawSuccess"));
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "start_secret_santa",
        projectId: secretSanta.projectId,
      });
      toast.error(t("drawError"));
    }
  }

  return (
    <ModalAction
      title={t("drawTitle")}
      description={t("drawDescription")}
      actionText={t("drawAction")}
      onAction={handleStart}
      trigger={<Action icon={PlayIcon} label={t("drawAction")} />}
    />
  );
}
