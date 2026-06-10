"use client";

import { Folders } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Event } from "@/app/_data/event";
import { Link } from "@/i18n/navigation";

type CalendarEvent = Omit<Event, "project">;

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import { textToHtml } from "@/lib/utils";
import TimeRange from "./time-range";

export default function EventPreview({ event }: { event: CalendarEvent }) {
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
    >
      <Card key={event.id}>
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-2">
            {event.name}
            {event.files.length > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Folders />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-normal text-base">{t("filesShared")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </CardTitle>
          <CardDescription>
            <TimeRange
              startAt={event.startAt}
              endAt={event.endAt}
              allDay={event.allDay}
            />
          </CardDescription>
        </CardHeader>
        {event.description && (
          <CardContent
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Already sanitized
            dangerouslySetInnerHTML={{ __html: textToHtml(event.description) }}
            className="wrap-break-word"
          />
        )}
      </Card>
    </Link>
  );
}
