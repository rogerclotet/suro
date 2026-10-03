"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import ModalAction from "@/components/ui/modal-action";
import { captureException } from "@/lib/error-reporting";

export default function UnlinkEventNoteModal({
  event,
  note,
  trigger,
}: {
  event: Event;
  note: { id: string };
  trigger: React.ReactNode;
}) {
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
      captureException(e, { action: "unlink_event_note" });
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
