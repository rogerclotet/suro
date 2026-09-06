// @vitest-environment node

import { unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";
import { createFilesArchive, safeDownloadName } from "@/lib/download-files";

describe("bulk file archives", () => {
  it("preserves every original, restores extensions and avoids duplicate names", async () => {
    const onProgress = vi.fn();
    const files = [
      { name: "Excursió", type: "image/jpeg", url: "data:image/jpeg,first" },
      {
        name: "Excursió.jpg",
        type: "image/jpeg",
        url: "data:image/jpeg,second",
      },
      {
        name: "Excursió (2).jpg",
        type: "image/jpeg",
        url: "data:image/jpeg,third",
      },
      {
        name: "Notes",
        type: "application/pdf",
        url: "data:application/pdf,pdf",
      },
      {
        name: "../../outside.txt",
        type: "text/plain",
        url: "data:text/plain,safe",
      },
    ];
    const archive = await createFilesArchive({
      files,
      signal: new AbortController().signal,
      onProgress,
    });
    const entries = unzipSync(new Uint8Array(await archive.arrayBuffer()));
    expect(archive.type).toBe("application/zip");
    expect(
      Object.fromEntries(
        Object.entries(entries).map(([name, data]) => [
          name,
          new TextDecoder().decode(data),
        ]),
      ),
    ).toEqual({
      "Excursió.jpg": "first",
      "Excursió (2).jpg": "second",
      "Excursió (2) (2).jpg": "third",
      "Notes.pdf": "pdf",
      "_.._outside.txt": "safe",
    });
    expect(onProgress.mock.calls).toEqual([[1], [2], [3], [4], [5]]);
  });

  it("fails the archive if a file is unavailable instead of silently omitting it", async () => {
    await expect(
      createFilesArchive({
        files: [{ name: "Missing", type: "image/jpeg", url: "" }],
        signal: new AbortController().signal,
        onProgress: vi.fn(),
      }),
    ).rejects.toThrow("File has no download URL");
  });

  it("stops fetching when the download is aborted", async () => {
    const controller = new AbortController();
    const onProgress = vi.fn(() => controller.abort());
    await expect(
      createFilesArchive({
        files: [
          { name: "First", type: "image/png", url: "data:image/png,first" },
          { name: "Second", type: "image/png", url: "data:image/png,second" },
        ],
        signal: controller.signal,
        onProgress,
      }),
    ).rejects.toThrow();
    expect(onProgress.mock.calls).toEqual([[1]]);
  });

  it("sanitizes archive names without losing accents", () => {
    expect(safeDownloadName("../Vacances: estiu/2026\n")).toBe(
      "_Vacances_ estiu_2026_",
    );
    expect(safeDownloadName(".. ")).toBe("file");
    expect(safeDownloadName("Excursió")).toBe("Excursió");
  });
});
