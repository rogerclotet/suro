import { redirect } from "next/navigation";
import { ClientOnly } from "@/components/client-only";
import ShareButton from "@/components/ui/share-button";
import { checkAuth } from "@/lib/check-auth";
import { getNote } from "@/server/notes";
import EventBacklink from "../../calendar/_components/event/event-backlink";
import NoteEditor from "./_components/note-editor";
import SettingsMenu from "./_components/settings-menu";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  const { projectId, noteId } = await params;

  await checkAuth();

  const note = await getNote(noteId);
  if (!note) {
    redirect(`/groups/${projectId}/notes`);
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
                params: {
                  projectId: note.projectId,
                  noteId: note.id,
                },
              }}
            />
          </ClientOnly>
          <SettingsMenu note={note} />
        </>
      }
      backlink={note.event && <EventBacklink event={note.event} />}
    />
  );
}
