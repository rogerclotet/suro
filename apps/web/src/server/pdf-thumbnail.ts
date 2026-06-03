import "server-only";

import sharp from "sharp";
import { UTFile } from "uploadthing/server";
import { utapi } from "./uploadthing";

const THUMBNAIL_WIDTH = 600;
const JPEG_QUALITY = 80;

let polyfilled = false;
async function ensurePolyfills() {
  if (polyfilled) return;
  const canvas = await import("@napi-rs/canvas");
  const g = globalThis as Record<string, unknown>;
  if (!g.DOMMatrix) g.DOMMatrix = canvas.DOMMatrix;
  if (!g.Path2D) g.Path2D = canvas.Path2D;
  if (!g.ImageData) g.ImageData = canvas.ImageData;
  polyfilled = true;
}

export async function generatePdfThumbnail(
  pdfUrl: string,
): Promise<{ url: string } | null> {
  try {
    const buffer = await downloadPdf(pdfUrl);
    const png = await renderFirstPage(buffer);
    const jpeg = await sharp(png)
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, progressive: true })
      .toBuffer();

    const file = new UTFile(
      [new Uint8Array(jpeg)],
      `pdf-thumbnail-${Date.now()}.jpg`,
      { type: "image/jpeg" },
    );
    const result = await utapi.uploadFiles(file);

    if (result.error || !result.data) {
      console.error("Failed to upload PDF thumbnail", result.error);
      return null;
    }

    return { url: result.data.ufsUrl };
  } catch (err) {
    console.error("Failed to generate PDF thumbnail", err);
    return null;
  }
}

async function downloadPdf(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download PDF: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function renderFirstPage(pdfBytes: Uint8Array): Promise<Buffer> {
  await ensurePolyfills();
  const { createCanvas } = await import("@napi-rs/canvas");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    disableFontFace: true,
    useSystemFonts: false,
  });
  const pdf = await loadingTask.promise;

  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({
      canvas: null,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    return canvas.toBuffer("image/png");
  } finally {
    await pdf.cleanup();
    await pdf.destroy();
  }
}
