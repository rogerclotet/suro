import { Folders } from "lucide-react";
import Link from "next/link";
import type { Event } from "@/app/_data/event";
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

export default function EventPreview({ event }: { event: Event }) {
  return (
    <Link prefetch href={`/grups/${event.projectId}/calendari/${event.id}`}>
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
                  <p className="text-base font-normal">Fitxers compartits</p>
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
            dangerouslySetInnerHTML={{ __html: textToHtml(event.description) }}
            className="wrap-break-word"
          />
        )}
      </Card>
    </Link>
  );
}
