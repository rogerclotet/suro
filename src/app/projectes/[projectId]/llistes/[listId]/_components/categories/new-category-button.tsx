"use client";

import { Plus } from "lucide-react";
import React from "react";
import NewCategoryDialog from "./new-category-dialog";

export default function NewCategoryButton() {
  const dialog = React.useRef<HTMLDialogElement>(null);

  return (
    <div>
      <button
        onClick={() => dialog.current?.showModal()}
        className="flex flex-row flex-nowrap items-center justify-start gap-2 text-nowrap"
      >
        <Plus size={20} /> Nova categoria
      </button>

      <NewCategoryDialog ref={dialog} onClose={() => dialog.current?.close()} />
    </div>
  );
}
