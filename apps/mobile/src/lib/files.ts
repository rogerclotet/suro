/** Human file size, ported from the PWA's readable-size.ts. */
export function readableSize(size: number): string {
  if (size < 1024) {
    return `${size} bytes`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(0)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function isImage(type: string): boolean {
  return type.startsWith("image/");
}

export function isPdf(type: string): boolean {
  return type === "application/pdf";
}

/** Drop the extension for the stored display name (matches the PWA). */
export function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}
