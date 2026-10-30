"use client";

import { CalendarFold } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Note } from "@/app/_data/note";
import { htmlToPreview } from "@/components/ui/rich-text-content";
import { Skeleton } from "@/components/ui/skeleton";
import { UnreadDot } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { formatRelative } from "@/lib/format-relative";
import { useUnreadItemCount } from "@/lib/queries/use-notifications";

export default function NotePreview({ note }: { note: Note }) {
  const locale = useLocale();
  const t = useTranslations("notes");
  const changes = useUnreadItemCount(note.projectId, note.id);
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
      className="group flex h-44 w-full flex-col rounded-xl bg-card p-4 text-sm shadow-sm ring-1 ring-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30"
    >
      <h3 className="flex items-center gap-1.5 font-semibold text-foreground">
        <span className="line-clamp-1">{note.name}</span>
        <UnreadDot count={changes} />
      </h3>
      <div className="mt-2 line-clamp-5 flex-1 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
        {preview || (
          <span className="text-muted-foreground/50 italic">
            {t("emptyPreview")}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] tracking-wide text-muted-foreground/70 uppercase">
        {note.eventId && (
          <CalendarFold className="size-3 shrink-0 text-primary/60" />
        )}
        {updatedLabel && <span className="truncate">{updatedLabel}</span>}
      </div>
    </Link>
  );
}

export function NotePreviewSkeleton() {
  return <Skeleton className="h-44 w-full rounded-xl" />;
}
