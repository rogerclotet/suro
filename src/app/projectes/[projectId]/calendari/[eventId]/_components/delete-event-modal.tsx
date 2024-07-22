"use client";

import type { Event } from "@/app/_data/event";
import ModalAction from "@/components/ui/modal-action";
import { captureException } from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { deleteEvent } from "../actions";

export default function DeleteEventModal({
  event,
  triggerRef,
}: {
  event: Event;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
  const router = useRouter();

  async function handleDelete() {
    try {
      await deleteEvent(event);
      router.push(`/projectes/${event.projectId}/calendari`);
      toast.success(`Esdeveniment ${event.name} eliminat`);
    } catch (e) {
      captureException(e);
      console.error(e);
      toast.error(
        "No s'ha pogut eliminar la plantilla, torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalAction
      title="Eliminar esdeveniment"
      description="Segur que vols eliminar l'esdeveniment? Aquesta acció no es pot desfer."
      actionText="Eliminar"
      onAction={handleDelete}
      variant="destructive"
      triggerRef={triggerRef}
    />
  );
}
