"use client";

import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { Pot } from "@/app/_data/pot";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";
import { unlinkEventPot } from "../actions";

export default function UnlinkEventPotModal({
  event,
  pot,
  trigger,
}: {
  event: Event;
  pot: Pot | undefined;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");

  async function handleUnlink() {
    if (pot === undefined) {
      return;
    }

    try {
      await unlinkEventPot(event, pot);
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

  if (pot === undefined) {
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
