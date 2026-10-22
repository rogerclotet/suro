"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ShuffleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { SecretSanta } from "@/app/_data/secret-santa";
import Action from "@/components/action";
import ModalAction from "@/components/ui/modal-action";
import { captureException } from "@/lib/error-reporting";
import { secretSantaErrorMessage } from "./errors";

export default function DrawButton({
  secretSanta,
  disabled,
}: {
  secretSanta: SecretSanta;
  disabled: boolean;
}) {
  const draw = useMutation(api.secretSantas.draw);
  const t = useTranslations("secretSanta");

  async function handleDraw() {
    try {
      await draw({ secretSantaId: secretSanta.id as Id<"secretSantas"> });
      toast.success(t("drawSuccess"));
    } catch (error) {
      const message = secretSantaErrorMessage(error, t);
      if (message === null) {
        captureException(error, { action: "draw_secret_santa" });
      }
      toast.error(message ?? t("drawError"));
    }
  }

  return (
    <ModalAction
      title={t("drawTitle")}
      description={t("drawDescription")}
      actionText={t("drawAction")}
      onAction={handleDraw}
      trigger={
        <Action
          icon={ShuffleIcon}
          label={t("drawAction")}
          disabled={disabled}
        />
      }
    />
  );
}
