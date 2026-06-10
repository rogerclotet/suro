"use client";

import { Plus } from "lucide-react";
import type { RefObject } from "react";

export default function NewCategoryButton({
  dialog,
}: {
  dialog: RefObject<HTMLDialogElement>;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="flex flex-row flex-nowrap items-center justify-start gap-2 text-nowrap"
      >
        <Plus size={20} /> Nova categoria
      </button>
    </div>
  );
}
