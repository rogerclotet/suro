"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useProjectNotes } from "@/lib/queries/use-notes";
import NotePreview, { NotePreviewSkeleton } from "./note-preview";

export default function NoteList({ projectId }: { projectId: string }) {
  const t = useTranslations("notes");
  const notes = useProjectNotes(projectId);

  if (notes === undefined) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 3 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <NotePreviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{t("empty")}</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {notes.map((note) => (
        <NotePreview key={note.id} note={note} />
      ))}
    </div>
  );
}
