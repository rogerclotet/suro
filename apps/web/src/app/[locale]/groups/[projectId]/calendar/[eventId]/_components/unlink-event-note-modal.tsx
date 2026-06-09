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

export default function UnlinkEventNoteModal({
  event,
  note,
  trigger,
}: {
  event: Event;
  note: { id: string };
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");
  const unlinkNote = useMutation(api.events.unlinkNote);

  async function handleUnlink() {
    try {
      await unlinkNote({
        eventId: event.id as Id<"events">,
        noteId: note.id as Id<"notes">,
      });
      toast.success(t("unlinkNoteSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "unlink_event_note",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("unlinkNoteError"));
    }
  }

  return (
    <ModalAction
      title={t("unlinkNoteTitle")}
      description={t("unlinkNoteDescription")}
      actionText={t("unlinkNoteButton")}
      onAction={handleUnlink}
      variant="destructive"
      trigger={trigger}
    />
  );
}
