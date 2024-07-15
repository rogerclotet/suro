import type { Event } from "@/app/_data/event";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { textToHtml } from "@/lib/utils";
import Link from "next/link";
import TimeRange from "./time-range";

export default function EventDetails({ event }: { event: Event }) {
  return (
    <Link prefetch href={`/projectes/${event.projectId}/calendari/${event.id}`}>
      <Card key={event.id}>
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>
            <TimeRange startAt={event.startAt} endAt={event.endAt} />
          </CardDescription>
        </CardHeader>
        {event.description && (
          <CardContent
            dangerouslySetInnerHTML={{ __html: textToHtml(event.description) }}
          />
        )}
      </Card>
    </Link>
  );
}
