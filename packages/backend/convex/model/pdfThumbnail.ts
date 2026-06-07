"use node";

import * as mupdf from "mupdf";

/**
 * Render a PDF's first page to a PNG, scaled so its longest side is at most
 * `maxDim` pixels (never upscaled). Returns the encoded PNG bytes.
 *
 * mupdf ships as WebAssembly, so this only runs inside a Node ("use node")
 * Convex action — keep it off the V8 runtime. Throws if the PDF is empty or
 * unreadable; callers treat a failure as "no thumbnail" (icon fallback).
 *
 * Returns an ArrayBuffer-backed copy (not WASM memory) so it's a valid BlobPart.
 */
export function renderPdfThumbnail(
  pdf: Uint8Array,
  maxDim: number,
): Uint8Array<ArrayBuffer> {
  const doc = mupdf.Document.openDocument(pdf, "application/pdf");
  try {
    if (doc.countPages() === 0) {
      throw new Error("PDF has no pages");
    }
    const page = doc.loadPage(0);
    try {
      const [x0, y0, x1, y1] = page.getBounds();
      const longest = Math.max(x1 - x0, y1 - y0);
      const scale = longest > 0 ? Math.min(1, maxDim / longest) : 1;
      const pixmap = page.toPixmap(
        mupdf.Matrix.scale(scale, scale),
        mupdf.ColorSpace.DeviceRGB,
        // No alpha: PDF pages render on white, and an opaque PNG is smaller.
        false,
      );
      try {
        const png = pixmap.asPNG();
        const out = new Uint8Array(png.length);
        out.set(png);
        return out;
      } finally {
        pixmap.destroy();
      }
    } finally {
      page.destroy();
    }
  } finally {
    doc.destroy();
  }
}
