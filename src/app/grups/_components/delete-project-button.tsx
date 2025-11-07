"use client";

import { Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { deleteProject } from "./actions";

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const { projects, selectProject } = useProjects();
  const { data: session } = useSession();

  const projectToDelete = projects.find((project) => project.id === projectId);
  if (!projectToDelete) {
    return null;
  }

  async function handleDelete() {
    if (!projectToDelete) {
      return;
    }

    try {
      await deleteProject(projectToDelete);
      const firstNonDeletedProject = projects.find(
        (project) => project.id !== projectId,
      );
      selectProject(firstNonDeletedProject);
      toast.success(`Grup ${projectToDelete.name} eliminat`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_project",
        projectId,
      });
      toast.error("No s'ha pogut eliminar el grup, torna-ho a provar més tard");
    }
  }

  return (
    <ModalAction
      title="Eliminar grup"
      description={`Estàs segur que vols eliminar el grup ${projectToDelete.name}? Aquesta acció no es pot desfer.`}
      actionText="Eliminar"
      onAction={handleDelete}
      variant="destructive"
      trigger={
        <Button variant="ghostDestructive" size="icon" aria-label="Eliminar">
          <Trash2 />
        </Button>
      }
    />
  );
}
