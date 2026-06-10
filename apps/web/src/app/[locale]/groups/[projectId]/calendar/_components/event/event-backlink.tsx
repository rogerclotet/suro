import { CalendarFold } from "lucide-react";
import { Link } from "@/i18n/navigation";
import TimeRange from "./time-range";

export default function EventBacklink({
  event,
}: {
  event: {
    id: string;
    name: string;
    projectId: string;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
  };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="flex items-center gap-2">
        <CalendarFold />
        <Link
          href={{
            pathname: "/groups/[projectId]/calendar/[eventId]",
            params: { projectId: event.projectId, eventId: event.id },
          }}
        >
          {event.name}
        </Link>
      </h2>
      <TimeRange
        startAt={event.startAt}
        endAt={event.endAt}
        allDay={event.allDay}
        className="mt-0.5 text-muted-foreground text-sm"
      />
    </div>
  );
}
