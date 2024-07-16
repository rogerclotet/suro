import getFiles from "@/server/files";
import { CornerRightUp } from "lucide-react";
import FilePreview from "./_components/file-preview";
import UploadButton from "./_components/upload-button";

export default async function FilesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const allFiles = await getFiles(projectId);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="mt-1 text-xl font-semibold">Fitxers</h1>
        <UploadButton projectId={projectId} />
      </div>

      {allFiles.length === 0 ? (
        <div className="flex flex-row items-center justify-end gap-4 pr-8 text-right sm:pr-16">
          Encara no hi ha fitxers, en pots compartir aquí{" "}
          <CornerRightUp className="mb-4 flex-shrink-0" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {allFiles.map((file) => (
            <FilePreview key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}