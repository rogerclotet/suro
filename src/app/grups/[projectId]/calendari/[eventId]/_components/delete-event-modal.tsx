"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import ModalAction from "@/components/ui/modal-action";
import { deleteEventOffline } from "@/lib/offline/offline-events";

export default function DeleteEventModal({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleDelete() {
    try {
      await deleteEventOffline(event);
      router.push(`/grups/${event.projectId}/calendari`);
      toast.success(`Esdeveniment ${event.name} eliminat`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_event",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(
        "No s'ha pogut eliminar l'esdeveniment, torna-ho a provar més tard",
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
      trigger={trigger}
    />
  );
}
