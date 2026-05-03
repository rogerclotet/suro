import { checkAuth } from "@/lib/check-auth";
import { getNotes } from "@/server/notes";
import NotePreview from "./note-preview";

export default async function NoteList({ projectId }: { projectId: string }) {
  await checkAuth();

  const notes = await getNotes(projectId);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {notes.map((note) => (
        <NotePreview key={note.id} note={note} />
      ))}
    </div>
  );
}
