"use client";

import type { File } from "@/app/_data/file";
import ModalAction from "@/components/ui/modal-action";
import { captureException } from "@sentry/nextjs";
import { Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { deleteFile } from "./actions";

export default function DeleteFileButton({ file }: { file: File }) {
  const triggerRef = React.useRef<HTMLDivElement>(null);

  async function handleDelete() {
    try {
      await deleteFile(file);
      toast.success(`Fitxer ${file.name} eliminat`);
    } catch (e) {
      captureException(e);
      console.error(e);
      toast.error(
        "No s'ha pogut eliminar el fitxer, torna-ho a provar més tard",
      );
    }
  }

  return (
    <>
      <button
        onClick={() => triggerRef.current?.click()}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 size={16} />
      </button>

      <ModalAction
        title="Eliminar fitxer"
        description="Estàs segur que vols eliminar aquest fitxer? Aquesta acció no es pot desfer"
        actionText="Eliminar"
        onAction={handleDelete}
        variant="destructive"
        triggerRef={triggerRef}
      />
    </>
  );
}
