"use client";

import type { List } from "@/app/_data/list";
import { Edit, Settings, Trash2 } from "lucide-react";
import React from "react";
import DeleteListDialog from "./delete-list-dialog";
import EditListDialog from "./edit-list-dialog";

export default function SettingsMenu({ list }: { list: List }) {
  const editDialog = React.useRef<HTMLDialogElement>(null);
  const deleteDialog = React.useRef<HTMLDialogElement>(null);

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-square btn-ghost">
        <Settings />
      </summary>
      <ul className="menu dropdown-content z-[1] rounded-box bg-base-200 p-2 shadow-xl">
        <li>
          <button
            onClick={() => editDialog.current?.showModal()}
            className="btn flex flex-nowrap justify-start text-nowrap"
          >
            <Edit />
            Editar llista
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => deleteDialog.current?.showModal()}
            className="btn btn-error flex flex-nowrap justify-start text-nowrap"
          >
            <Trash2 />
            Eliminar llista
          </button>
        </li>
      </ul>

      <EditListDialog
        ref={editDialog}
        list={list}
        onClose={() => editDialog.current?.close()}
      />
      <DeleteListDialog
        ref={deleteDialog}
        list={list}
        onClose={() => deleteDialog.current?.close()}
      />
    </details>
  );
}
