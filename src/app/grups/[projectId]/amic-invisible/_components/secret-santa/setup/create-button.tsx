"use client";

import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { posthog } from "posthog-js";
import { toast } from "sonner";
import type { SecretSantaData } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import ModalForm from "@/components/ui/modal-form";
import { createSecretSanta } from "@/server/secret-santa";
import SecretSantaForm from "../../form";

export default function CreateButton() {
  const { project } = useProjects();
  const { data: session } = useSession();

  async function handleCreate(data: SecretSantaData) {
    if (!project) {
      posthog.captureException(
        "Project is not defined when creating secret santa",
        {
          distinctId: session?.user.id,
          action: "create_secret_santa",
        },
      );
      toast.error(
        "No s'ha pogut crear l'amic invisible, torna-ho a provar més tard",
      );
      return;
    }

    try {
      await createSecretSanta(project, data);
      toast.success("Amic Invisible creat");
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "create_secret_santa",
        projectId: project.id,
      });
      toast.error(
        "No s'ha pogut crear l'amic invisible, torna-ho a provar més tard",
      );
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
          label="Crear amic invisible"
          pathParts={["grups", project.id, "amic-invisible"]}
        />
      }
      title="Crear Amic Invisible"
      description={`Crear un amic invisible pel grup ${project.name}`}
    >
      <SecretSantaForm
        onChange={handleCreate}
        submitText="Crear"
        submitIcon={<PlusIcon />}
      />
    </ModalForm>
  );
}
