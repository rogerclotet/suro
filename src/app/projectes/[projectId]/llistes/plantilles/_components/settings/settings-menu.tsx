"use client";

import type { Template } from "@/app/_data/list";
import { Edit, Settings, Trash2 } from "lucide-react";
import React from "react";
import DeleteTemplateDialog from "./delete-template-dialog";
import EditTemplateDialog from "./edit-template-dialog";

export default function SettingsMenu({ template }: { template: Template }) {
  const editDialog = React.useRef<HTMLDialogElement>(null);
  const deleteDialog = React.useRef<HTMLDialogElement>(null);

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-square btn-ghost">
        <Settings />
      </summary>
      <ul className="menu dropdown-content z-[1] gap-2 rounded-box bg-base-200 p-2 shadow-xl">
        <li>
          <a
            onClick={() => editDialog.current?.showModal()}
            className="btn flex flex-nowrap justify-start text-nowrap"
          >
            <Edit />
            Editar plantilla
          </a>
        </li>
        <li>
          <a
            onClick={() => deleteDialog.current?.showModal()}
            className="btn btn-error flex flex-nowrap justify-start text-nowrap"
          >
            <Trash2 />
            Eliminar plantilla
          </a>
        </li>
      </ul>

      <EditTemplateDialog
        ref={editDialog}
        template={template}
        onClose={() => editDialog.current?.close()}
      />
      <DeleteTemplateDialog
        ref={deleteDialog}
        template={template}
        onClose={() => deleteDialog.current?.close()}
      />
    </details>
  );
}
