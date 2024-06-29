"use client";

import type { Project } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";
import { Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { deleteProject } from "./actions";

export default function DeleteProjectButton({
  projectId,
  projects,
}: {
  projectId: string;
  projects: Project[];
}) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const { selectProject } = useSelectedProject();

  const projectToDelete = projects.find((project) => project.id === projectId);
  if (!projectToDelete) {
    return null;
  }

  async function handleDelete() {
    dialog.current?.close();

    if (!projectToDelete) {
      return;
    }

    try {
      await deleteProject(projectToDelete);
      const firstNonDeletedProject = projects.find(
        (project) => project.id !== projectId,
      );
      selectProject(firstNonDeletedProject!.id);
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
      <button
        onClick={() => dialog.current?.showModal()}
        aria-label="Eliminar"
        className="btn btn-square btn-error btn-sm"
      >
        <Trash2 />
      </button>

      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Eliminar projecte</h3>
          <p className="mb-4">
            Estàs segur que vols eliminar el projecte{" "}
            <span className="font-bold">{projectToDelete.name}</span>? Aquesta
            acció no es pot desfer.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-neutral">Cancel·lar</button>
            </form>
            <form action={handleDelete}>
              <button className="btn btn-error">Eliminar</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
