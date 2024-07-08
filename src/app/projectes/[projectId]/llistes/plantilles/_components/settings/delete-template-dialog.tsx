"use client";

import type { Template } from "@/app/_data/list";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { deleteTemplate } from "./actions";

type Props = { template: Template; onClose: () => void };

const DeleteTemplateDialog = React.forwardRef<HTMLDialogElement, Props>(
  ({ template, onClose }, ref) => {
    const router = useRouter();

    async function handleDelete() {
      onClose();

      try {
        await deleteTemplate(template);
        router.push(`/projectes/${template.projectId}/llistes/plantilles`);

        toast.success(`Plantilla ${template.name} eliminada`);
      } catch (error) {
        console.error(error);
        toast.error(
          "No s'ha pogut eliminar la plantilla, torna-ho a provar més tard",
        );
      }
    }

    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Eliminar plantilla</h3>
          <p className="mb-4">
            Estàs segur que vols eliminar la plantilla{" "}
            <span className="font-bold">{template.name}</span>? Aquesta acció no
            es pot desfer.
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
    );
  },
);

DeleteTemplateDialog.displayName = "DeleteTemplateDialog";

export default DeleteTemplateDialog;
