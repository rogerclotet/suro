"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("calendar");

  async function handleUnlink() {
    if (list === undefined) {
      return;
    }

    try {
      await unlinkEventList(event, list);
      toast.success(t("unlinkListSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "unlink_event_list",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("unlinkListError"));
    }
  }

  if (list === undefined) {
    return null;
  }

  return (
    <ModalAction
      title={t("unlinkListTitle")}
      description={t("unlinkListDescription")}
      actionText={t("unlinkListButton")}
      onAction={handleUnlink}
      variant="destructive"
      trigger={trigger}
    />
  );
}
