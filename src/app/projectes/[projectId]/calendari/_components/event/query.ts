import type { Event } from "@/app/_data/event";
import { queryOptions } from "@tanstack/react-query";
import getMonthString from "./get-month-string";

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

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0);

      const res = await fetch(
        `/api/${projectId}/events?from=${monthStart.valueOf()}&to=${monthEnd.valueOf()}`,
      );
      return (await res.json()) as Event[];
    },
    select: (data) => {
      return data.map((event) => ({
        ...event,
        startAt: new Date(event.startAt),
        endAt: new Date(event.endAt),
      }));
    },
    staleTime: 60 * 1000,
  });
}
