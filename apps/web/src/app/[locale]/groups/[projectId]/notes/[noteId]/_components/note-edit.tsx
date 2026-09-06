"use client";

import type { Id } from "backend/convex/_generated/dataModel";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import Action from "@/components/action";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useRouter } from "@/i18n/navigation";
import { useNoteEditLock } from "@/lib/queries/use-note-edit-lock";
import { useNote } from "@/lib/queries/use-notes";
import NoteEditor from "./note-editor";

/**
 * The note editing screen. Edits autosave, so the FAB just returns to the
 * reading view — `replace` so the browser back button skips the editor.
 */
export default function NoteEdit({ noteId }: { noteId: string }) {
  const note = useNote(noteId);
  const lock = useNoteEditLock(noteId as Id<"notes">);
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

  if (lock.kind !== "editing") {
    return (
      <>
        <p role="status">
          {t(
            lock.kind === "loading"
              ? "startingEdit"
              : lock.kind === "error"
                ? "lockError"
                : "editingBySomeone",
          )}
        </p>
        <h1 className="font-semibold text-xl">{note.name}</h1>
        <RichTextContent format={note.format} content={note.contents} />
        <Action label={t("doneEditing")} icon={CheckIcon} onClick={done} />
      </>
    );
  }

  return (
    <>
      {!lock.valid && <p role="alert">{t("lockLost")}</p>}
      <NoteEditor
        note={{
          ...note,
          name: lock.lease.note.name,
          contents: lock.lease.note.contents,
          format: lock.lease.note.format,
        }}
        editLockId={lock.lease.lockId}
        canEdit={lock.valid}
      />
      <Action label={t("doneEditing")} icon={CheckIcon} onClick={done} />
    </>
  );
}
