"use client";

import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { unlinkEventList } from "../actions";

export default function UnlinkEventListModal({
  event,
  list,
  trigger,
}: {
  event: Event;
  list: List | undefined;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();

  async function handleUnlink() {
    if (list === undefined) {
      return;
    }

    try {
      await unlinkEventList(event, list);
      toast.success("S'ha desenllaçat la llista");
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "unlink_event_list",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(
        "No s'ha pogut desenllaçar la llista, torna-ho a provar més tard",
      );
    }
  }

  if (list === undefined) {
    return null;
  }

  return (
    <ModalAction
      title="Desenllaçar llista"
      description="Segur que vols desenllaçar la llista d'aquest esdeveniment? La llista no s'eliminarà."
      actionText="Desenllaçar"
      onAction={handleUnlink}
      variant="destructive"
      trigger={trigger}
    />
  );
}
