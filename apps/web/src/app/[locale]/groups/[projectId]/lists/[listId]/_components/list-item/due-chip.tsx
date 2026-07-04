"use client";

import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { useLocale } from "next-intl";
import type { routing } from "@/i18n/routing";
import { getDateFnsLocaleForUi } from "@/lib/date-locale";
import { cn } from "@/lib/utils";

/**
 * Compact due-date chip for task items. Renders an overdue (destructive) style
 * when the due moment has passed and the task is still open. All-day dues show
 * just the day; timed dues append the time.
 */
export function DueChip({
  dueAt,
  allDay,
  completed,
  className,
}: {
  dueAt: Date;
  allDay: boolean;
  completed: boolean;
  className?: string;
}) {
  const uiLocale = useLocale() as (typeof routing.locales)[number];
  const dfLocale = getDateFnsLocaleForUi(uiLocale);
  const overdue = !completed && dueAt.getTime() < Date.now();

  // All-day dues are stored at UTC midnight; read their day from UTC parts (and
  // format that as a local date) so the timezone can't shift them onto an
  // adjacent day. Timed dues format in local time as their exact instant.
  const label = allDay
    ? format(
        new Date(
          dueAt.getUTCFullYear(),
          dueAt.getUTCMonth(),
          dueAt.getUTCDate(),
        ),
        "d MMM",
        { locale: dfLocale },
      )
    : format(dueAt, "d MMM HH:mm", { locale: dfLocale });

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs tabular-nums",
        overdue
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <CalendarClock className="size-3" />
      {label}
    </span>
  );
}
