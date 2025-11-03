import { CornerRightUp } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import getProjectFiles from "@/server/files";
import Files from "./_components/files";
import UploadButton from "./_components/upload-button";
import ViewSelector from "./_components/view-selector";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  const allFiles = await getProjectFiles(projectId);

  return (
    <div>
      <div className="mb-4 flex items-start justify-end gap-4">
        {/* TODO Improve UX of view selector */}
        {allFiles.length > 0 && <ViewSelector />}
        <UploadButton projectId={projectId} />
      </div>

      {allFiles.length === 0 ? (
        <div className="flex flex-row items-center justify-end gap-4 pr-8 text-right sm:pr-16">
          Encara no hi ha fitxers, en pots compartir aquí{" "}
          <CornerRightUp className="mb-4 shrink-0" />
        </div>
      ) : (
        <Files files={allFiles} />
      )}
    </div>
  );
}
