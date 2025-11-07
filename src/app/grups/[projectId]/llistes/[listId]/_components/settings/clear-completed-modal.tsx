"use client";

import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { clearCompletedItems } from "./actions";

export default function ClearCompletedModal({
  list,
  trigger,
}: {
  list: List;
  trigger: ReactNode;
}) {
  const { data: session } = useSession();

  async function handleClear() {
    try {
      await clearCompletedItems(list);
      toast.success("Elements completats esborrats");
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "clear_completed_items",
        projectId: list.projectId,
        listId: list.id,
      });
      toast.error(
        "No s'han pogut esborrar els elements completats, torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalAction
      title="Esborrar completats"
      description="Segur que vols esborrar els elements completats? Aquesta acció no es pot desfer."
      actionText="Esborrar"
      onAction={handleClear}
      variant="destructive"
      trigger={trigger}
    />
  );
}
