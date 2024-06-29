"use client";

import type { List } from "@/app/_data/list";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { deleteList } from "./actions";

export default function DeleteListButton({ list }: { list: List }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const router = useRouter();

  async function handleDelete() {
    dialog.current?.close();

    try {
      await deleteList(list);
      router.push(`/projectes/${list.projectId}/llistes`);

      toast.success(`Llista ${list.name} eliminada`);
    } catch (error) {
      console.error(error);
      toast.error(
        "No s'ha pogut eliminar la llista, torna-ho a provar més tard",
      );
    }
  }

  return (
    <div>
      <button
        onClick={() => dialog.current?.showModal()}
        className="btn btn-error flex-nowrap justify-start text-nowrap"
      >
        <Trash2 />
        Eliminar llista
      </button>

      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Eliminar llista</h3>
          <p className="mb-4">
            Estàs segur que vols eliminar la llista{" "}
            <span className="font-bold">{list.name}</span>? Aquesta acció no es
            pot desfer.
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
    </div>
  );
}
