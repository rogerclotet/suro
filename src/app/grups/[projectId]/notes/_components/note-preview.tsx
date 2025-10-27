import Link from "next/link";
import type { Note } from "@/app/_data/note";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotePreview({ note }: { note: Note }) {
  return (
    <Link
      href={`/grups/${note.projectId}/notes/${note.id}`}
      className="h-36 w-full rounded-md bg-card p-2 text-sm drop-shadow-sm"
    >
      <h3 className="line-clamp-1 font-semibold">{note.name}</h3>
      <div className="mt-2 line-clamp-5 whitespace-pre-line">
        {note.contents}
      </div>
    </Link>
  );
}

export function NotePreviewSkeleton() {
  return <Skeleton className="h-36 w-full" />;
}
