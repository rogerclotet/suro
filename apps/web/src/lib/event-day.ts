import type { CalendarEvent } from "@/app/_data/event";

const DAY_MS = 86_400_000;

/**
 * Whether `event` covers `date` by calendar day (date-only comparison). All-day
 * events store `endAt` one day past the last day (half-open), so the inclusive
 * end subtracts a day. Ported 1:1 from the calendar/mobile day logic.
 */
export function isEventOnDay(event: CalendarEvent, date: Date): boolean {
  const endAt = event.allDay
    ? new Date(event.endAt.getTime() - DAY_MS)
    : event.endAt;

  const eventStart = new Date(
    event.startAt.getFullYear(),
    event.startAt.getMonth(),
    event.startAt.getDate(),
  );
  const eventEnd = new Date(
    endAt.getFullYear(),
    endAt.getMonth(),
    endAt.getDate(),
    23,
    59,
    59,
    999,
  );

  return eventStart <= date && eventEnd >= date;
}
