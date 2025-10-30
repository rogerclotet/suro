import { Suspense } from "react";
import CreateNoteButton from "./_components/create-note-button/create-note-button";
import NoteList from "./_components/note-list";
import { NotePreviewSkeleton } from "./_components/note-preview";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="mt-1 text-xl font-semibold">Notes</h1>

        <CreateNoteButton projectId={projectId} />
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[...Array<undefined>(3)].map((_, i) => (
              <NotePreviewSkeleton key={i.toString()} />
            ))}
          </div>
        }
      >
        <NoteList projectId={projectId} />
      </Suspense>
    </div>
  );
}
