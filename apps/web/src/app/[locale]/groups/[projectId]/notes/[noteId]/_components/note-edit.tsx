"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import Action from "@/components/action";
import { useRouter } from "@/i18n/navigation";
import { useNote } from "@/lib/queries/use-notes";
import NoteEditor from "./note-editor";

/**
 * The note editing screen. Edits autosave, so the FAB just returns to the
 * reading view — `replace` so the browser back button skips the editor.
 */
export default function NoteEdit({ noteId }: { noteId: string }) {
  const note = useNote(noteId);
  const router = useRouter();
  const t = useTranslations("notes");

  const projectId = note?.projectId;
  const done = useCallback(() => {
    if (!projectId) return;
    router.replace({
      pathname: "/groups/[projectId]/notes/[noteId]",
      params: { projectId, noteId },
    });
  }, [router, projectId, noteId]);

  if (note === undefined || note === null) {
    return null;
  }

  return (
    <>
      <NoteEditor note={note} />
      <Action label={t("doneEditing")} icon={CheckIcon} onClick={done} />
    </>
  );
}
