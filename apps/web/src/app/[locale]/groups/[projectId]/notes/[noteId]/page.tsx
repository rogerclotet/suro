import { checkAuth } from "@/lib/check-auth";
import NoteDetail from "./_components/note-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  await checkAuth();

  const { projectId, noteId } = await params;

  return <NoteDetail projectId={projectId} noteId={noteId} />;
}
