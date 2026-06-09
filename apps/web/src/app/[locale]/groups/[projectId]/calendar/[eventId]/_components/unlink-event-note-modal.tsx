"use client";

import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { Note } from "@/app/_data/note";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";
import { unlinkEventNote } from "../actions";

export default function UnlinkEventNoteModal({
  event,
  note,
  trigger,
}: {
  event: Event;
  note: Note;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");

  async function handleUnlink() {
    try {
      await unlinkEventNote(event, note);
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
