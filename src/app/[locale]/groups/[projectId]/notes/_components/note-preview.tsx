import { getLocale } from "next-intl/server";
import type { Note } from "@/app/_data/note";
import { htmlToPreview } from "@/components/ui/rich-text-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";

export default async function NotePreview({ note }: { note: Note }) {
  const locale = await getLocale();
  const preview = htmlToPreview(note.format, note.contents);
  const updatedAt = note.updatedAt ?? note.createdAt;
  const updatedLabel = updatedAt ? formatRelative(updatedAt, locale) : null;

  return (
    <Link
      href={
        {
          pathname: "/groups/[projectId]/notes/[noteId]",
          params: { projectId: note.projectId, noteId: note.id },
        } as never
      }
      className="group flex h-44 w-full flex-col rounded-md bg-card p-3 text-sm shadow-sm ring-border/50 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1"
    >
      <h3 className="line-clamp-1 font-semibold">{note.name}</h3>
      <div className="mt-1.5 line-clamp-5 flex-1 whitespace-pre-line text-muted-foreground text-xs leading-snug">
        {preview || <span className="italic opacity-60">…</span>}
      </div>
      {updatedLabel && (
        <div className="mt-2 truncate text-[10px] text-muted-foreground/70 uppercase tracking-wide">
          {updatedLabel}
        </div>
      )}
    </Link>
  );
}

export function NotePreviewSkeleton() {
  return <Skeleton className="h-44 w-full" />;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelative(date: Date, locale: string): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < MINUTE) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(0, "minute");
  }
  if (diff < HOUR) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-Math.floor(diff / MINUTE), "minute");
  }
  if (diff < DAY) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-Math.floor(diff / HOUR), "hour");
  }
  if (diff < 7 * DAY) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-Math.floor(diff / DAY), "day");
  }

  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
