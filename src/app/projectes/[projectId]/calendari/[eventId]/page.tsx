import type { Event } from "@/app/_data/event";
import { auth } from "@/auth";
import { getEvent } from "@/server/events";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import TimeRange from "../_components/event/time-range";

export default async function EventPage({
  params: { projectId, eventId },
}: {
  params: { projectId: string; eventId: string };
}) {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  const event = await getEvent(projectId, eventId);
  if (event === undefined) {
    toast.error("No s'ha trobat l'esdeveniment");
    return redirect(`/projectes/${projectId}/calendari`);
  }

  function TimeRemaining({
    event,
    className,
  }: {
    event: Event;
    className?: string;
  }) {
    const now = new Date();
    const timeRemaining = event.startAt.getTime() - now.getTime();

    if (timeRemaining < 0) {
      return null;
    }

    const oneHour = 1000 * 60 * 60;
    const oneDay = oneHour * 24;
    const days = Math.floor(timeRemaining / oneDay);
    const hours = Math.floor((timeRemaining % oneDay) / oneHour);

    if (days > 0 || hours > 0) {
      if (days > 2 || hours === 0) {
        return <span className={className}>Falten {days} dies</span>;
      } else {
        return (
          <span className={className}>
            Falten {days} dies i {hours} hores
          </span>
        );
      }
    }

    const minutes = Math.floor(timeRemaining / (1000 * 60));
    if (minutes > 0) {
      return <span className={className}>Falten {minutes} minuts</span>;
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{event.name}</h1>
      </div>

      <p className="flex flex-wrap text-sm text-muted-foreground">
        <TimeRemaining
          event={event}
          className="mr-2 text-foreground opacity-70"
        />
        <TimeRange startAt={event.startAt} endAt={event.endAt} />
      </p>

      <p>{event.description}</p>
    </div>
  );
}
