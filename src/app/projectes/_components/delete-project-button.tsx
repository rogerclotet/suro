"use client";

import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { deleteProject } from "./actions";

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const { projects, selectProject } = useProjects();

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
      selectProject(firstNonDeletedProject!);
      toast.success(`Projecte ${projectToDelete.name} eliminat`);
    } catch (error) {
      console.error(error);
      toast.error(
        "No s'ha pogut eliminar el projecte, torna-ho a provar més tard",
      );
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => modalRef.current?.click()}
        aria-label="Eliminar"
        className="hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 />
      </Button>

      <ModalAction
        title="Eliminar projecte"
        description={`Estàs segur que vols eliminar el projecte ${projectToDelete.name}? Aquesta acció no es pot desfer.`}
        actionText="Eliminar"
        onAction={handleDelete}
        variant="destructive"
        triggerRef={modalRef}
      />
    </>
  );
}
