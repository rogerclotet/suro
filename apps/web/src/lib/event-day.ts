import { isEventOnDay as coversDay, type EventTimes } from "domain/events";
import type { CalendarEvent } from "@/app/_data/event";
export function eventTimes(
  event: Pick<CalendarEvent, "startAt" | "endAt" | "allDay">,
): EventTimes {
  return {
    startAt: event.startAt.getTime(),
    endAt: event.endAt.getTime(),
    allDay: event.allDay,
  };
}
export function isEventOnDay(event: CalendarEvent, date: Date): boolean {
  return coversDay(eventTimes(event), date);
}
