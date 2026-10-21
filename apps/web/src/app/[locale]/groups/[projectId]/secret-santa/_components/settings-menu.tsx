"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArchiveIcon, Edit, SaveIcon, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ProjectMember } from "@/app/_data/project";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
import { captureException } from "@/lib/error-reporting";
import { secretSantaErrorMessage } from "./errors";
import {
  exchangeFromValues,
  type SecretSantaFormValues,
  secretSantaValues,
} from "./form-values";
import SecretSantaForm from "./secret-santa-form";

export default function SettingsMenu({
  secretSanta,
  members,
}: {
  secretSanta: SecretSanta;
  members: ProjectMember[];
}) {
  const archive = useMutation(api.secretSantas.archive);
  const t = useTranslations("secretSanta");

  async function handleArchive() {
    try {
      await archive({ secretSantaId: secretSanta.id as Id<"secretSantas"> });
      toast.success(t("settingsArchiveSuccess"));
    } catch (error) {
      captureException(error, { action: "archive_secret_santa" });
      toast.error(t("settingsArchiveError"));
    }
  }

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button variant="ghost" size="icon" aria-label={t("settingsTitle")}>
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
              className="cursor-pointer gap-2"
            >
              <Edit />
              {t("settingsEditTitle")}
            </ResponsiveMenuItem>
          }
        >
          <EditForm secretSanta={secretSanta} members={members} />
        </ModalForm>

        <ModalAction
          title={t("settingsArchiveTitle")}
          description={t("settingsArchiveDescription")}
          actionText={t("settingsArchiveAction")}
          variant="destructive"
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

function EditForm({
  secretSanta,
  members,
}: {
  secretSanta: SecretSanta;
  members: ProjectMember[];
}) {
  const { close } = useModalForm();
  const update = useMutation(api.secretSantas.update);
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  async function handleSubmit(values: SecretSantaFormValues) {
    try {
      await update({
        secretSantaId: secretSanta.id as Id<"secretSantas">,
        name: values.name,
        description: values.description,
        ...exchangeFromValues(values),
        priceRange: values.priceRange,
        participantIds: values.participantIds as Id<"users">[],
      });
      toast.success(t("settingsEditSuccess"));
      close();
    } catch (error) {
      const message = secretSantaErrorMessage(error, t);
      if (message === null) {
        captureException(error, { action: "edit_secret_santa" });
      }
      toast.error(message ?? t("settingsEditError"));
    }
  }

  // Members who left after the draw still take part, so list them too.
  const memberIds = new Set(members.map(({ user }) => user.id));
  const formerParticipants: ProjectMember[] = secretSanta.participants
    .filter((participant) => !memberIds.has(participant.id))
    .map((participant) => ({
      user: { ...participant, customImage: participant.image },
    }));

  return (
    <SecretSantaForm
      initialValues={secretSantaValues(secretSanta)}
      members={[...members, ...formerParticipants]}
      participantsLocked={secretSanta.drawn}
      submitText={tCommon("save")}
      submitIcon={<SaveIcon />}
      onSubmit={handleSubmit}
    />
  );
}
