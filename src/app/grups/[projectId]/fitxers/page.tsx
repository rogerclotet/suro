import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Alert, AlertTitle } from "@/components/ui/alert";
import getProjectFiles from "@/server/files";
import { getUserProject } from "@/server/projects";
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

  const project = await getUserProject(projectId);
  if (!project) {
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
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Encara no hi ha fitxers</AlertTitle>
        </Alert>
      ) : (
        <Files files={allFiles} />
      )}
    </div>
  );
}
