"use client";

import { Folders } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Event } from "@/app/_data/event";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import { Link } from "@/i18n/navigation";
import { cn, textToHtml } from "@/lib/utils";
import TimeRange from "./time-range";

type CalendarEvent = Omit<Event, "project">;

/**
 * Flat day-list row (lists/home style) — accent rail + title/time, no card chrome.
 */
export default function EventPreview({
  event,
  accentClass,
}: {
  event: CalendarEvent;
  accentClass: string;
}) {
  const t = useTranslations("calendar");
  return (
    <Link
      prefetch
      href={
        {
          pathname: "/groups/[projectId]/calendar/[eventId]",
          params: { projectId: event.projectId, eventId: event.id },
        } as never
      }
      className="flex items-stretch gap-3 px-1 py-3 transition-colors hover:bg-border/40"
    >
      <div className={cn("w-1 shrink-0 rounded-full", accentClass)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="truncate font-semibold text-base leading-snug">
            {event.name}
          </div>
          {event.files.length > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Folders className="size-4 shrink-0 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-normal text-base">{t("filesShared")}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="mt-0.5 text-[13px] text-muted-foreground">
          <TimeRange
            startAt={event.startAt}
            endAt={event.endAt}
            allDay={event.allDay}
          />
        </div>
        {event.description ? (
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Already sanitized
            dangerouslySetInnerHTML={{ __html: textToHtml(event.description) }}
            className="wrap-break-word mt-1 line-clamp-2 text-muted-foreground text-sm"
          />
        ) : null}
      </div>
    </Link>
  );
}
