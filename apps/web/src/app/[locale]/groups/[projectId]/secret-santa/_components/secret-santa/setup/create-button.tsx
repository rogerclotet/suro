"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { posthog } from "posthog-js";
import { toast } from "sonner";
import type { SecretSantaData } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import ModalForm from "@/components/ui/modal-form";
import { useSession } from "@/lib/session";
import { createSecretSanta } from "@/server/secret-santa";
import SecretSantaForm from "../../form";

export default function CreateButton() {
  const { project } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  async function handleCreate(data: SecretSantaData) {
    if (!project) {
      posthog.captureException(
        "Project is not defined when creating secret santa",
        {
          distinctId: session?.user.id,
          action: "create_secret_santa",
        },
      );
      toast.error(t("createError"));
      return;
    }

    try {
      await createSecretSanta(project, data);
      toast.success(t("createSuccess"));
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "create_secret_santa",
        projectId: project.id,
      });
      toast.error(t("createError"));
    }
  }

  if (!project) {
    return null;
  }

  return (
    <ModalForm
      trigger={
        <Action
          icon={PlusIcon}
          label={t("createAction")}
          pathParts={["grups", project.id, "amic-invisible"]}
        />
      }
      title={t("createTitle")}
      description={t("createDescription", { projectName: project.name })}
    >
      <SecretSantaForm
        onChange={handleCreate}
        submitText={tCommon("create")}
        submitIcon={<PlusIcon />}
      />
    </ModalForm>
  );
}
