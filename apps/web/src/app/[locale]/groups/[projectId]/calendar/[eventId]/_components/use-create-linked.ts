"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import { captureException } from "@/lib/error-reporting";

/**
 * The "create and link a fresh record" actions for an event, shared by the
 * settings menu and the add-to-event prompt chips.
 */
export function useCreateLinked(event: Event): {
  handleCreateLinkedList: () => Promise<void>;
  handleCreateLinkedNote: () => Promise<void>;
} {
  const t = useTranslations("calendar");
  const createLinkedList = useMutation(api.events.createLinkedList);
  const createLinkedNote = useMutation(api.events.createLinkedNote);

  async function handleCreateLinkedList() {
    try {
      await createLinkedList({ eventId: event.id as Id<"events"> });
      toast.success(t("createListSuccess"));
    } catch (e) {
      captureException(e, { action: "create_event_list" });
      toast.error(t("createListError"));
    }
  }

  async function handleCreateLinkedNote() {
    try {
      await createLinkedNote({ eventId: event.id as Id<"events"> });
      toast.success(t("createNoteSuccess"));
    } catch (e) {
      captureException(e, { action: "create_event_note" });
      toast.error(t("createNoteError"));
    }
  }

  return {
    handleCreateLinkedList,
    handleCreateLinkedNote,
  };
}
