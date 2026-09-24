/** All-day storage uses UTC date parts and an exclusive end. Timed values are instants. */
export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
export type EventTimes = { startAt: number; endAt: number; allDay: boolean };
export type EventDates = { from: Date; to: Date };
export type EventDateDraft =
  | { allDay: true; dates: EventDates; timedDates: EventDates | null }
  | { allDay: false; dates: EventDates };

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
export function utcMidnight(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day);
}
export function dateOnlyTimestamp(date: Date): number {
  return utcMidnight(date.getFullYear(), date.getMonth(), date.getDate());
}
export function localDayFromUtc(timestamp: number): Date {
  const date = new Date(timestamp);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
export function allDayDisplayEnd(endAt: number): Date {
  return localDayFromUtc(endAt - DAY_MS);
}
export function inclusiveDayCount(from: Date, to: Date): number {
  return (
    Math.round(
      Math.abs(dateOnlyTimestamp(to) - dateOnlyTimestamp(from)) / DAY_MS,
    ) + 1
  );
}
/** Convert the API's inclusive all-day end to its exclusive storage boundary. */
export function normalizeEventEnd(endAt: number, allDay: boolean): number {
  return allDay ? endAt + DAY_MS : endAt;
}
export function eventDatesForForm(event: EventTimes): EventDates {
  return event.allDay
    ? {
        from: localDayFromUtc(event.startAt),
        to: allDayDisplayEnd(event.endAt),
      }
    : { from: new Date(event.startAt), to: new Date(event.endAt) };
}
export function eventDatesForMutation({
  dates,
  allDay,
}: {
  dates: EventDates;
  allDay: boolean;
}): EventTimes {
  return {
    startAt: allDay ? dateOnlyTimestamp(dates.from) : dates.from.getTime(),
    endAt: allDay ? dateOnlyTimestamp(dates.to) : dates.to.getTime(),
    allDay,
  };
}
/** Both event kinds occupy [start, end). An event ending at midnight skips that day. */
export function eventOverlapsRange(
  event: EventTimes,
  from: number,
  to: number,
): boolean {
  return event.startAt <= to && event.endAt > from;
}
export function eventOverlapsDays(
  event: EventTimes,
  from: Date,
  to: Date,
): boolean {
  return eventOverlapsRange(
    event,
    event.allDay ? dateOnlyTimestamp(from) : startOfDay(from).getTime(),
    event.allDay ? dateOnlyTimestamp(to) + DAY_MS - 1 : endOfDay(to).getTime(),
  );
}
export function isEventOnDay(event: EventTimes, day: Date): boolean {
  return eventOverlapsDays(event, day, day);
}
/** Fetch both UTC date-only boundaries and local timed boundaries, then filter by day. */
export function calendarQueryBounds(
  from: Date,
  to: Date,
): { from: number; to: number } {
  return {
    from: Math.min(startOfDay(from).getTime(), dateOnlyTimestamp(from)),
    to: Math.max(endOfDay(to).getTime(), dateOnlyTimestamp(to) + DAY_MS - 1),
  };
}
/** Query a whole number of local days, including today, without DST drift. */
export function eventWindowBounds(now = new Date(), windowMs = 30 * DAY_MS) {
  const today = startOfDay(now);
  const last = new Date(today);
  last.setDate(last.getDate() + Math.ceil(windowMs / DAY_MS) - 1);
  return { today, lastDay: last, ...calendarQueryBounds(today, last) };
}
export function eventLocalStart(
  event: Pick<EventTimes, "startAt" | "allDay">,
): Date {
  return event.allDay
    ? localDayFromUtc(event.startAt)
    : new Date(event.startAt);
}
export function pickUpcomingEvents<T extends EventTimes>(
  events: T[],
  now = new Date(),
  limit = 5,
): T[] {
  const sorted = [...events].sort(
    (a, b) => eventLocalStart(a).getTime() - eventLocalStart(b).getTime(),
  );
  const today = sorted.filter((event) => isEventOnDay(event, now));
  const upcoming = sorted.filter(
    (event) => eventLocalStart(event).getTime() > endOfDay(now).getTime(),
  );
  return [...today, ...upcoming].slice(0, limit);
}

/** Today uses the next half-hour slot; other dates start at 09:00. Duration is one hour. */
export function selectEventDays(
  from: Date,
  to: Date,
  allDay: boolean,
  times?: EventDates,
  now = new Date(),
): EventDates {
  if (allDay) return { from: startOfDay(from), to: startOfDay(to) };
  let start = startOfDay(from);
  let end = startOfDay(to);
  if (times) {
    start.setHours(times.from.getHours(), times.from.getMinutes(), 0, 0);
    end.setHours(times.to.getHours(), times.to.getMinutes(), 0, 0);
  } else {
    if (sameDay(from, now)) {
      start = new Date(
        now.getTime() +
          (30 - (now.getMinutes() % 30)) * MINUTE_MS -
          now.getSeconds() * 1000 -
          now.getMilliseconds(),
      );
    } else {
      start.setHours(9, 0, 0, 0);
    }
    end = new Date(start);
    end.setDate(end.getDate() + inclusiveDayCount(from, to) - 1);
    end = new Date(end.getTime() + HOUR_MS);
  }
  if (end <= start) end = new Date(start.getTime() + HOUR_MS);
  return { from: start, to: end };
}
export function createEventDateDraft(day: Date): EventDateDraft {
  return {
    allDay: true,
    dates: { from: startOfDay(day), to: startOfDay(day) },
    timedDates: null,
  };
}
export function editEventDateDraft(event: EventTimes): EventDateDraft {
  const dates = eventDatesForForm(event);
  return event.allDay
    ? { allDay: true, dates, timedDates: null }
    : { allDay: false, dates };
}
export function changeEventDays(
  draft: EventDateDraft,
  days: EventDates,
): EventDateDraft {
  return {
    ...draft,
    dates: selectEventDays(days.from, days.to, draft.allDay, draft.dates),
  };
}
export function toggleEventAllDay(
  draft: EventDateDraft,
  allDay: boolean,
  now = new Date(),
): EventDateDraft {
  if (draft.allDay === allDay) return draft;
  if (!draft.allDay) {
    return {
      allDay: true,
      dates: selectEventDays(draft.dates.from, draft.dates.to, true),
      timedDates: draft.dates,
    };
  }
  return {
    allDay: false,
    dates: selectEventDays(
      draft.dates.from,
      draft.dates.to,
      false,
      draft.timedDates ?? undefined,
      now,
    ),
  };
}
export function changeEventStart(dates: EventDates, from: Date): EventDates {
  return {
    from,
    to: new Date(
      from.getTime() +
        Math.max(dates.to.getTime() - dates.from.getTime(), MINUTE_MS),
    ),
  };
}
export function changeEventEnd(dates: EventDates, to: Date): EventDates {
  return {
    from: to > dates.from ? dates.from : new Date(to.getTime() - HOUR_MS),
    to,
  };
}

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
  const remaining = eventLocalStart(event).getTime() - now;
  if (remaining < MINUTE_MS) return null;
  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);
  if (days > 2 || (days > 0 && hours === 0)) return { kind: "days", days };
  if (days > 0) return { kind: "daysHours", days, hours };
  if (hours > 1) return { kind: "hours", hours };
  if (hours > 0) return { kind: "oneHourMinutes", minutes };
  return { kind: "minutes", minutes };
}
