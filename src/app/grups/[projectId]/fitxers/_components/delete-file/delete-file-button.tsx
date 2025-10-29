"use client";

import { captureException } from "@sentry/nextjs";
import { Trash2 } from "lucide-react";
import { useLogger } from "next-axiom";
import React from "react";
import { toast } from "sonner";
import type { File } from "@/app/_data/file";
import ModalAction from "@/components/ui/modal-action";
import { deleteFile } from "./actions";

export default function DeleteFileButton({ file }: { file: File }) {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const log = useLogger();

  async function handleDelete() {
    try {
      await deleteFile(file);
      toast.success(`Fitxer ${file.name} eliminat`);
    } catch (e) {
      captureException(e);
      log.error("Error deleting file", {
        error: e,
        projectId: file.project.id,
      });
      toast.error(
        "No s'ha pogut eliminar el fitxer, torna-ho a provar més tard",
      );
    }
  }

  return (
    <>
      <button
        type="button"
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
