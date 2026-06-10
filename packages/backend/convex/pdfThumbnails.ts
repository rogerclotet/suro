"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { renderPdfThumbnail } from "./model/pdfThumbnail";

// Page previews render at most this wide/tall — comfortably above the gallery's
// tile size (so they stay crisp on high-DPI screens) without storing full pages.
const THUMBNAIL_MAX_DIM = 480;

/**
 * Render a freshly-uploaded PDF's first page to a PNG and attach it as the
 * file's thumbnail. Scheduled from `saveFile` (off the write transaction), runs
 * in Node because mupdf is WebAssembly, and is best-effort: if the bytes are
 * gone or unrenderable the file just keeps its icon fallback.
 */
export const generate = internalAction({
  args: { fileId: v.id("files"), storageId: v.id("_storage") },
  handler: async (ctx, { fileId, storageId }) => {
    const blob = await ctx.storage.get(storageId);
    if (blob === null) {
      return null; // File deleted before we got to it.
    }

    let png: Uint8Array<ArrayBuffer>;
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      png = renderPdfThumbnail(bytes, THUMBNAIL_MAX_DIM);
    } catch (error) {
      console.error(`PDF thumbnail render failed for ${fileId}`, error);
      return null;
    }

    const thumbnailStorageId = await ctx.storage.store(
      new Blob([png], { type: "image/png" }),
    );
    await ctx.runMutation(internal.files.attachThumbnail, {
      fileId,
      thumbnailStorageId,
    });
    return null;
  },
});
