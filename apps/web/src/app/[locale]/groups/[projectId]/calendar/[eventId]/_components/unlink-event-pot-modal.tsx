"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";

export default function UnlinkEventPotModal({
  event,
  pot,
  trigger,
}: {
  event: Event;
  pot: { id: string } | null;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");
  const unlinkPot = useMutation(api.events.unlinkPot);

  async function handleUnlink() {
    if (pot === null) {
      return;
    }

    try {
      await unlinkPot({
        eventId: event.id as Id<"events">,
        potId: pot.id as Id<"pots">,
      });
      toast.success(t("unlinkPotSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "unlink_event_pot",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("unlinkPotError"));
    }
  }

  if (pot === null) {
    return null;
  }

  return (
    <ModalAction
      title={t("unlinkPotTitle")}
      description={t("unlinkPotDescription")}
      actionText={t("unlinkPotButton")}
      onAction={handleUnlink}
      variant="destructive"
      trigger={trigger}
    />
  );
}
