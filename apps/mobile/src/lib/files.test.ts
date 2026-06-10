import { describe, expect, it } from "vitest";
import { isImage, isPdf, readableSize, stripExtension } from "./files";

const KB = 1024;
const MB = 1024 * 1024;

describe("readableSize", () => {
  it("reports raw bytes under 1 KiB", () => {
    expect(readableSize(0)).toBe("0 bytes");
    expect(readableSize(512)).toBe("512 bytes");
    expect(readableSize(1023)).toBe("1023 bytes");
  });

  it("reports whole kilobytes under 1 MiB", () => {
    expect(readableSize(KB)).toBe("1 KB");
    expect(readableSize(1536)).toBe("2 KB");
    expect(readableSize(MB - 1)).toBe("1024 KB");
  });

  it("reports megabytes with two decimals at 1 MiB and above", () => {
    expect(readableSize(MB)).toBe("1.00 MB");
    expect(readableSize(MB * 1.5)).toBe("1.50 MB");
    expect(readableSize(MB * 5)).toBe("5.00 MB");
  });
});

describe("isImage", () => {
  it("matches image MIME types", () => {
    expect(isImage("image/png")).toBe(true);
    expect(isImage("image/jpeg")).toBe(true);
  });

  it("rejects non-image MIME types", () => {
    expect(isImage("application/pdf")).toBe(false);
    expect(isImage("")).toBe(false);
  });
});

describe("isPdf", () => {
  it("matches the PDF MIME type exactly", () => {
    expect(isPdf("application/pdf")).toBe(true);
    expect(isPdf("image/png")).toBe(false);
    expect(isPdf("application/pdf; charset=utf-8")).toBe(false);
  });
});

describe("stripExtension", () => {
  it("drops a single trailing extension", () => {
    expect(stripExtension("report.pdf")).toBe("report");
    expect(stripExtension("photo.JPG")).toBe("photo");
  });

  it("only drops the last extension", () => {
    expect(stripExtension("my.photo.png")).toBe("my.photo");
  });

  it("leaves names without an extension untouched", () => {
    expect(stripExtension("README")).toBe("README");
  });
});
