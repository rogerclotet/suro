"use client";

import { Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import React from "react";
import { toast } from "sonner";
import type { File } from "@/app/_data/file";
import ModalAction from "@/components/ui/modal-action";
import { deleteFile } from "./actions";

export default function DeleteFileButton({ file }: { file: File }) {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  async function handleDelete() {
    try {
      await deleteFile(file);
      toast.success(`Fitxer ${file.name} eliminat`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_file",
        projectId: file.project.id,
        eventId: file.eventId,
        fileId: file.id,
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
