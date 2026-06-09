"use client";

import { ClientOnly } from "@/components/client-only";
import ShareButton from "@/components/ui/share-button";
import { useNote } from "@/lib/queries/use-notes";
import NoteEditor from "./note-editor";
import SettingsMenu from "./settings-menu";

export default function NoteDetail({
  projectId,
  noteId,
}: {
  projectId: string;
  noteId: string;
}) {
  const note = useNote(noteId);

  if (note === undefined || note === null) {
    return null;
  }

  return (
    <NoteEditor
      note={note}
      actions={
        <>
          <ClientOnly>
            <ShareButton
              title={note.name}
              text=""
              href={{
                pathname: "/groups/[projectId]/notes/[noteId]",
                params: { projectId: note.projectId, noteId: note.id },
              }}
            />
          </ClientOnly>
          <SettingsMenu note={note} />
        </>
      }
    />
  );
}
