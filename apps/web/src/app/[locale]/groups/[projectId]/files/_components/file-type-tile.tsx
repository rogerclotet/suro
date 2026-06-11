import { File as FileIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function isPdf(type: string): boolean {
  return type.includes("pdf");
}

/**
 * Small "PDF" chip overlaid on a PDF page preview so its type stays clear —
 * mirrors the mobile gallery's `PdfBadge` (theme-aware `pdf` red instead of
 * the old static red SVG).
 */
export function PdfBadge() {
  return (
    <span
      aria-hidden
      className="absolute right-1.5 bottom-1.5 rounded-[6px] bg-pdf px-1.5 py-0.5 font-bold text-[10px] text-white tracking-[1px]"
    >
      PDF
    </span>
  );
}

/**
 * Centered glyph tile for files without a preview — mirrors the mobile
 * gallery's `IconTile`: PDFs get the `pdf` red glyph plus a "PDF" caption,
 * anything else a muted generic file glyph.
 */
export function FileTypeTile({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const pdf = isPdf(type);
  const Icon = pdf ? FileText : FileIcon;
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1",
        className,
      )}
    >
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className={cn("size-1/3", pdf ? "text-pdf" : "text-muted-foreground")}
      />
      {pdf && (
        <span className="font-bold text-pdf text-xs tracking-[1px]">PDF</span>
      )}
    </div>
  );
}
