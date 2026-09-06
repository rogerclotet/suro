"use client";

import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { File } from "@/app/_data/file";
import { Button } from "@/components/ui/button";

export default function DownloadFilesButton({
  files,
  archiveName,
  photosOnly = false,
}: {
  files: File[];
  archiveName: string;
  photosOnly?: boolean;
}) {
  const t = useTranslations("files");
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const downloads = photosOnly
    ? files.filter((file) => file.type.startsWith("image/"))
    : files;

  useEffect(() => () => controller.current?.abort(), []);

  async function download() {
    if (controller.current) {
      return;
    }
    const abortController = new AbortController();
    controller.current = abortController;
    const total = downloads.length;
    setProgress({ completed: 0, total });
    try {
      const { createFilesArchive, saveArchive } = await import(
        "@/lib/download-files"
      );
      const archive = await createFilesArchive({
        files: downloads,
        signal: abortController.signal,
        onProgress: (completed) => setProgress({ completed, total }),
      });
      if (!abortController.signal.aborted) {
        saveArchive(archive, archiveName);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        posthog.captureException(error, { action: "download_files" });
        toast.error(t("downloadError"));
      }
    } finally {
      controller.current = null;
      if (!abortController.signal.aborted) {
        setProgress(null);
      }
    }
  }

  if (downloads.length === 0 && progress === null) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={progress !== null}
      aria-busy={progress !== null}
      onClick={download}
    >
      {progress ? <Loader2 className="animate-spin" /> : <Download />}
      <span aria-live="polite">
        {progress
          ? t("downloading", progress)
          : t(photosOnly ? "downloadPhotos" : "downloadAll")}
      </span>
    </Button>
  );
}
