import getFiles from "@/server/files";
import { CornerRightUp } from "lucide-react";
import UploadButton from "./_components/upload-button";
import ViewSelector from "./_components/view-selector";
import Files from "./files";

export default async function FilesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const allFiles = await getFiles(projectId);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-grow flex-row flex-wrap items-center justify-between gap-2">
          <h1 className="mt-1 text-xl font-semibold">Fitxers</h1>
          <ViewSelector />
        </div>

        <UploadButton projectId={projectId} />
      </div>

      {allFiles.length === 0 ? (
        <div className="flex flex-row items-center justify-end gap-4 pr-8 text-right sm:pr-16">
          Encara no hi ha fitxers, en pots compartir aquí{" "}
          <CornerRightUp className="mb-4 flex-shrink-0" />
        </div>
      ) : (
        <Files files={allFiles} />
      )}
    </div>
  );
}
