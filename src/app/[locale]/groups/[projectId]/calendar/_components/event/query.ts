import { queryOptions } from "@tanstack/react-query";
import type { Event } from "@/app/_data/event";
import getMonthString from "./get-month-string";
import { getMonthEnd } from "./month-range";

type EventResponse = Omit<Event, "startAt" | "endAt"> & {
  startAt: string | Date;
  endAt: string | Date;
};

export function normalizeEvents(data: EventResponse[]) {
  return data
    .map((event) => ({
      ...event,
      startAt: new Date(event.startAt),
      endAt: new Date(event.endAt),
    }))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function eventsQueryOptions(
  monthStart: Date | undefined,
  projectId: string | undefined,
) {
  const month = monthStart ? getMonthString(monthStart) : "";
  return queryOptions({
    queryKey: ["events", month],
    queryFn: async () => {
      if (!monthStart || !projectId) {
        return [];
      }

      const monthEnd = getMonthEnd(monthStart);

      const res = await fetch(
        `/api/${projectId}/events?from=${monthStart.valueOf()}&to=${monthEnd.valueOf()}`,
      );
      if (!res.ok) {
        throw new Error("No s'han pogut obtenir els esdeveniments");
      }

      const events = (await res.json()) as EventResponse[];
      return events;
    },
    select: normalizeEvents,
    staleTime: 60 * 1000,
  });
}
