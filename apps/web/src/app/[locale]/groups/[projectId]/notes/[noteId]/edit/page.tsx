import { checkAuth } from "@/lib/check-auth";
import NoteEdit from "../_components/note-edit";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  await checkAuth();

  const { noteId } = await params;

  return <NoteEdit noteId={noteId} />;
}
