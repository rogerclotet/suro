"use client";

import { captureException } from "@sentry/nextjs";
import { useLogger } from "next-axiom";
import type React from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { clearCompletedItems } from "./actions";

export default function ClearCompletedModal({
  list,
  triggerRef,
}: {
  list: List;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
  const log = useLogger();

  async function handleClear() {
    try {
      await clearCompletedItems(list);
      toast.success("Elements completats esborrats");
    } catch (e) {
      captureException(e);
      log.error("Error clearing completed items", {
        error: e,
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
      triggerRef={triggerRef}
    />
  );
}
