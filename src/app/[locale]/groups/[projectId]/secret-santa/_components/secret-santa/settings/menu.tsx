"use client";

import { ArchiveIcon, Edit, SaveIcon, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useRef } from "react";
import { toast } from "sonner";
import type { SecretSanta, SecretSantaData } from "@/app/_data/secret-santa";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import ModalForm from "@/components/ui/modal-form";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
import { archiveSecretSanta, updateSecretSanta } from "@/server/secret-santa";
import SecretSantaForm from "../../form";

export default function SettingsMenu({
  secretSanta,
}: {
  secretSanta: SecretSanta;
}) {
  const { data: session } = useSession();
  const editDialogRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  async function handleEdit(data: SecretSantaData) {
    try {
      await updateSecretSanta(secretSanta, data);
      editDialogRef.current?.click();
      toast.success(t("settingsEditSuccess"));
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "edit_secret_santa",
        projectId: secretSanta.projectId,
      });
      toast.error(t("settingsEditError"));
    }
  }

  async function handleArchive() {
    try {
      await archiveSecretSanta(secretSanta);
      toast.success(t("settingsArchiveSuccess"));
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "archive_secret_santa",
        projectId: secretSanta.projectId,
      });
      toast.error(t("settingsArchiveError"));
    }
  }

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </ResponsiveMenuTrigger>

      <ResponsiveMenuContent>
        <ModalForm
          title={t("settingsEditTitle")}
          description={t("settingsEditDescription", { name: secretSanta.name })}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              ref={editDialogRef}
              className="cursor-pointer gap-2"
            >
              <Edit />
              {t("settingsEditTitle")}
            </ResponsiveMenuItem>
          }
        >
          <SecretSantaForm
            initialData={getSecretSantaData(secretSanta)}
            assignmentsDone={secretSanta.assignmentsDone}
            onChange={handleEdit}
            submitText={tCommon("save")}
            submitIcon={<SaveIcon />}
          />
        </ModalForm>

        <ModalAction
          title={t("settingsArchiveTitle")}
          description={t("settingsArchiveDescription")}
          actionText={t("settingsArchiveAction")}
          onAction={handleArchive}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <ArchiveIcon />
              {t("settingsArchiveAction")}
            </ResponsiveMenuItem>
          }
        />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

function getSecretSantaData(secretSanta: SecretSanta): SecretSantaData {
  return {
    name: secretSanta.name,
    description: secretSanta.description,
    priceRange: secretSanta.priceRange,
    datetime: secretSanta.datetime,
    participants: secretSanta.participants.map(
      (participant) => participant.userId,
    ),
  };
}
