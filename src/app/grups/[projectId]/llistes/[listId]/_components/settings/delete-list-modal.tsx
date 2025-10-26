"use client";

import { captureException } from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { useLogger } from "next-axiom";
import type React from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { deleteList } from "./actions";

export default function DeleteListModal({
  list,
  triggerRef,
}: {
  list: List;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
  const router = useRouter();
  const log = useLogger();

  async function handleDelete() {
    try {
      await deleteList(list);
      router.push(`/grups/${list.projectId}/llistes`);

      toast.success(`Llista ${list.name} eliminada`);
    } catch (e) {
      captureException(e);
      log.error("Error deleting list", {
        error: e,
        projectId: list.projectId,
        listId: list.id,
      });
      toast.error(
        "No s'ha pogut eliminar la llista, torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalAction
      title="Eliminar llista"
      description="Segur que vols eliminar la llista? Aquesta acció no es pot desfer."
      actionText="Eliminar"
      onAction={handleDelete}
      variant="destructive"
      triggerRef={triggerRef}
    />
  );
}
