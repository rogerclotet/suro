import { redirect } from "next/navigation";
import { ClientOnly } from "@/components/client-only";
import { RichTextContent } from "@/components/ui/rich-text-content";
import ShareButton from "@/components/ui/share-button";
import { checkAuth } from "@/lib/check-auth";
import { getNote } from "@/server/notes";
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-semibold text-xl">{note.name}</h1>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <RichTextContent format={note.format} content={note.contents} />
    </div>
  );
}
