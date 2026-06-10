// @vitest-environment node
// mupdf is WebAssembly and only runs in Node — the Convex action that calls it
// is "use node". The rest of the suite uses edge-runtime, so pin this file back
// to Node to mirror the real action runtime.
import { describe, expect, it } from "vitest";
import { renderPdfThumbnail } from "./pdfThumbnail";

/** A valid single-page PDF (a blue square) with a correct xref table. */
function makeSquarePdf(): Uint8Array {
  const content = "0 0 1 rg 60 60 280 280 re f\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 400] /Resources << >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return new TextEncoder().encode(body + xref + trailer);
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("renderPdfThumbnail", () => {
  it("renders page 1 to PNG bytes, capped at the requested size", () => {
    const png = renderPdfThumbnail(makeSquarePdf(), 200);

    expect(png.length).toBeGreaterThan(PNG_SIGNATURE.length);
    expect([...png.slice(0, PNG_SIGNATURE.length)]).toEqual(PNG_SIGNATURE);

    // The 400pt page scaled to a 200px longest side: IHDR width is bytes 16–19.
    const width = new DataView(png.buffer, png.byteOffset).getUint32(16);
    expect(width).toBe(200);
  });

  it("throws on bytes that aren't a PDF", () => {
    expect(() =>
      renderPdfThumbnail(new TextEncoder().encode("not a pdf"), 200),
    ).toThrow();
  });
});
