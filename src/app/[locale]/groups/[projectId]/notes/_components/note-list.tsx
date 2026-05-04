import { InfoIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { checkAuth } from "@/lib/check-auth";
import { getNotes } from "@/server/notes";
import NotePreview from "./note-preview";

export default async function NoteList({ projectId }: { projectId: string }) {
  await checkAuth();

  const notes = await getNotes(projectId);
  const t = await getTranslations("notes");

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
