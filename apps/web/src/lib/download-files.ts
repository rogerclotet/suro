import { Zip, ZipPassThrough } from "fflate";
import type { File } from "@/app/_data/file";

type DownloadFile = Pick<File, "name" | "type" | "url">;

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export function safeDownloadName(name: string): string {
  return (
    name
      // File names are user-controlled; keep every ZIP entry at the root.
      // biome-ignore lint/suspicious/noControlCharactersInRegex: Strip control characters from download names.
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/^[. ]+|[. ]+$/g, "") || "file"
  );
}

function uniqueFileName(file: DownloadFile, usedNames: Set<string>): string {
  let name = safeDownloadName(file.name);
  const extension = extensions[file.type];
  if (extension && !/\.[a-z0-9]{1,10}$/i.test(name)) {
    name += `.${extension}`;
  }
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const suffix = dot > 0 ? name.slice(dot) : "";
  let candidate = name;
  let count = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${stem} (${count++})${suffix}`;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

/** Fetch originals sequentially and collect ZIP chunks without recompressing photos. */
export async function createFilesArchive({
  files,
  signal,
  onProgress,
}: {
  files: readonly DownloadFile[];
  signal: AbortSignal;
  onProgress: (completed: number) => void;
}): Promise<Blob> {
  const chunks: BlobPart[] = [];
  const zip = new Zip((error, data) => {
    if (error) {
      throw error;
    }
    chunks.push(new Uint8Array(data));
  });
  const usedNames = new Set<string>();
  let completed = 0;

  try {
    for (const file of files) {
      signal.throwIfAborted();
      if (!file.url) {
        throw new Error("File has no download URL");
      }
      const response = await fetch(file.url, {
        signal,
        credentials: "omit",
        // Older cached image responses may predate the file endpoint's CORS header.
        cache: "no-cache",
      });
      if (!response.ok || !response.body) {
        throw new Error(`File download failed (${response.status})`);
      }
      const entry = new ZipPassThrough(uniqueFileName(file, usedNames));
      zip.add(entry);
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            entry.push(new Uint8Array(0), true);
            break;
          }
          entry.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      onProgress(++completed);
    }
    signal.throwIfAborted();
    zip.end();
    return new Blob(chunks, { type: "application/zip" });
  } finally {
    zip.terminate();
  }
}

export function saveArchive(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeDownloadName(name)}.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  // Give browsers time to begin reading the object URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
