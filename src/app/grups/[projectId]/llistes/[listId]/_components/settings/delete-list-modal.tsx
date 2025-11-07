"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import type { RefObject } from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { deleteList } from "./actions";

export default function DeleteListModal({
  list,
  triggerRef,
}: {
  list: List;
  triggerRef: RefObject<HTMLDivElement | null>;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleDelete() {
    try {
      await deleteList(list);
      router.push(`/grups/${list.projectId}/llistes`);

      toast.success(`Llista ${list.name} eliminada`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_list",
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
