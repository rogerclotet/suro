"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";

export default function UnlinkEventListModal({
  event,
  list,
  trigger,
}: {
  event: Event;
  list: List | null;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");
  const unlinkList = useMutation(api.events.unlinkList);

  async function handleUnlink() {
    if (list === null) {
      return;
    }

    try {
      await unlinkList({
        eventId: event.id as Id<"events">,
        listId: list.id as Id<"lists">,
      });
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

  if (list === null) {
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
