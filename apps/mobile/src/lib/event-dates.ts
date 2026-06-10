/**
 * Date/time helpers for the calendar, ported 1:1 from the PWA so events render
 * identically. Events store epoch-ms `startAt`/`endAt`; all-day events keep
 * `endAt` one day past the last day (half-open), so display/overlap logic
 * subtracts a day. Explicit Intl options are used (not dateStyle/timeStyle) for
 * the widest Hermes compatibility.
 */

export const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

export type EventTimes = {
  startAt: number;
  endAt: number;
  allDay: boolean;
};

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Midnight (00:00) of the given day in the device's local zone. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** UTC midnight epoch-ms for a calendar day — the all-day storage boundary. */
export function utcMidnight(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day, 0, 0, 0, 0);
}

/** The inclusive last day to *display* for an all-day event (endAt − 1 day). */
export function allDayDisplayEnd(endAt: number): Date {
  const d = new Date(endAt);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
}

/**
 * Number of calendar days an inclusive `from`…`to` span covers (1 for a single
 * day). Compares date parts via UTC so it's exact across DST transitions.
 */
export function inclusiveDayCount(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round(Math.abs(b - a) / DAY_MS) + 1;
}

/** Whether the event covers `day` (date-only comparison), ported from the PWA. */
export function isEventOnDay(event: EventTimes, day: Date): boolean {
  const endMs = event.allDay ? event.endAt - DAY_MS : event.endAt;
  const start = new Date(event.startAt);
  const end = new Date(endMs);
  const eventStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const eventEnd = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999,
  );
  return eventStart <= day && eventEnd >= day;
}

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
  const start = new Date(event.startAt);
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
 * Countdown to the event start as a localizable descriptor, ported from
 * time-remaining.tsx. Returns null once the event has started (or is < 1 minute
 * away). The UI maps the descriptor to a translated, pluralized string.
 */
export type TimeRemaining =
  | { kind: "days"; days: number }
  | { kind: "daysHours"; days: number; hours: number }
  | { kind: "hours"; hours: number }
  | { kind: "oneHourMinutes"; minutes: number }
  | { kind: "minutes"; minutes: number };

export function timeRemainingParts(
  event: EventTimes,
  now: number,
): TimeRemaining | null {
  const remaining = event.startAt - now;
  if (remaining < 0) {
    return null;
  }
  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);

  if (days > 2 || (days > 0 && hours === 0)) {
    return { kind: "days", days };
  }
  if (days > 0) {
    return { kind: "daysHours", days, hours };
  }
  if (hours > 1) {
    return { kind: "hours", hours };
  }
  if (hours > 0) {
    return { kind: "oneHourMinutes", minutes };
  }
  if (minutes > 0) {
    return { kind: "minutes", minutes };
  }
  return null;
}
