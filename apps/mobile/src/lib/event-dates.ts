import { allDayDisplayEnd, eventLocalStart, sameDay } from "domain/events";

export {
  allDayDisplayEnd,
  DAY_MS,
  type EventTimes,
  endOfDay,
  eventLocalStart,
  eventWindowBounds,
  inclusiveDayCount,
  isEventOnDay,
  pickUpcomingEvents,
  sameDay,
  startOfDay,
  type TimeRemaining,
  timeRemainingParts,
  utcMidnight,
} from "domain/events";

import type { EventTimes } from "domain/events";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};
const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

/**
 * Human time-range string, ported from time-range.tsx. `locale` (a BCP-47 tag
 * or undefined) selects the language; pass the active UI locale so dates render
 * in it — `undefined` falls back to the device locale.
 */
export function formatTimeRange(event: EventTimes, locale?: string): string {
  const start = eventLocalStart(event);
  const end = new Date(event.endAt);

  if (event.allDay) {
    const displayEnd = allDayDisplayEnd(event.endAt);
    if (sameDay(displayEnd, start)) {
      return start.toLocaleDateString(locale, DATE_OPTS);
    }
    return `${start.toLocaleDateString(locale, DATE_OPTS)} - ${displayEnd.toLocaleDateString(locale, DATE_OPTS)}`;
  }

  if (sameDay(start, end)) {
    return `${start.toLocaleString(locale, { ...DATE_OPTS, ...TIME_OPTS })} - ${end.toLocaleTimeString(locale, TIME_OPTS)}`;
  }
  return `${start.toLocaleString(locale, { ...DATE_OPTS, ...TIME_OPTS })} - ${end.toLocaleString(locale, { ...DATE_OPTS, ...TIME_OPTS })}`;
}

/**
 * Time-of-day label for contexts where the event's date is already shown (a
 * calendar day header, the Home "Today" section): just the clock times for a
 * same-day timed event, so the date isn't repeated. A single all-day event
 * returns "" — the caller supplies a translated "All day" — and an event that
 * genuinely spans multiple days falls back to the full dated range, since the
 * span can't be conveyed by times alone.
 */
export function formatTimeOfDay(event: EventTimes, locale?: string): string {
  const start = eventLocalStart(event);

  if (event.allDay) {
    return sameDay(allDayDisplayEnd(event.endAt), start)
      ? ""
      : formatTimeRange(event, locale);
  }

  const end = new Date(event.endAt);
  if (sameDay(start, end)) {
    return `${start.toLocaleTimeString(locale, TIME_OPTS)} - ${end.toLocaleTimeString(locale, TIME_OPTS)}`;
  }
  return formatTimeRange(event, locale);
}
