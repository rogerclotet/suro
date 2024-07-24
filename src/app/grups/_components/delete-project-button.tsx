"use client";

import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { captureException } from "@sentry/nextjs";
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
      selectProject(firstNonDeletedProject);
      toast.success(`Grup ${projectToDelete.name} eliminat`);
    } catch (e) {
      captureException(e);
      console.error(e);
      toast.error("No s'ha pogut eliminar el grup, torna-ho a provar més tard");
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
        title="Eliminar grup"
        description={`Estàs segur que vols eliminar el grup ${projectToDelete.name}? Aquesta acció no es pot desfer.`}
        actionText="Eliminar"
        onAction={handleDelete}
        variant="destructive"
        triggerRef={modalRef}
      />
    </>
  );
}
