"use client";

import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { deleteEventOffline } from "@/lib/offline/offline-events";
import { useSession } from "@/lib/session";

export default function DeleteEventModal({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");

  async function handleDelete() {
    try {
      await deleteEventOffline(event);
      router.push({
        pathname: "/groups/[projectId]/calendar",
        params: { projectId: event.projectId },
      });
      toast.success(t("deleteSuccess", { name: event.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_event",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("deleteError"));
    }
  }

  return (
    <ModalAction
      title={t("deleteTitle")}
      description={t("deleteDescription")}
      actionText={tCommon("delete")}
      onAction={handleDelete}
      variant="destructive"
      trigger={trigger}
    />
  );
}
