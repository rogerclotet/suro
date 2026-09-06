"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useProjectFiles } from "@/lib/queries/use-files";
import DownloadFilesButton from "./download-files-button";
import Files from "./files";
import UploadButton from "./upload-button";
import ViewSelector from "./view-selector";

export default function FilesView({ projectId }: { projectId: string }) {
  const t = useTranslations("files");
  const files = useProjectFiles(projectId);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-end gap-2">
        {files && files.length > 0 && <ViewSelector />}
        {files && (
          <DownloadFilesButton
            files={files}
            archiveName={`suro-${projectId}`}
          />
        )}
        <UploadButton projectId={projectId} />
      </div>

      {files === undefined ? null : files.length === 0 ? (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>{t("empty")}</AlertTitle>
        </Alert>
      ) : (
        <Files files={files} />
      )}
    </div>
  );
}
