import { useLocale, useTranslations } from "@/i18n";
import {
  type EventTimes,
  formatTimeOfDay,
  formatTimeRange,
  timeRemainingParts,
} from "@/lib/event-dates";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Coarse "time ago" buckets. We compute these ourselves instead of using
 * `Intl.RelativeTimeFormat` because iOS Hermes ships no `RelativeTimeFormat`
 * (only DateTime/Number/Collator), so calling it crashes with FORMATTING_ERROR;
 * Android's Hermes proxies to system ICU and would work, but we keep both
 * platforms on one code path. Older-than-a-week timestamps fall back to an
 * absolute localized date.
 */
type TimeAgoParts =
  | { kind: "justNow" }
  | { kind: "minutes"; minutes: number }
  | { kind: "hours"; hours: number }
  | { kind: "days"; days: number }
  | { kind: "date"; date: Date };

function timeAgoParts(epochMs: number, now: number): TimeAgoParts {
  const diff = now - epochMs;
  if (diff < MINUTE_MS) {
    return { kind: "justNow" };
  }
  if (diff < HOUR_MS) {
    return { kind: "minutes", minutes: Math.floor(diff / MINUTE_MS) };
  }
  if (diff < DAY_MS) {
    return { kind: "hours", hours: Math.floor(diff / HOUR_MS) };
  }
  if (diff < 7 * DAY_MS) {
    return { kind: "days", days: Math.floor(diff / DAY_MS) };
  }
  return { kind: "date", date: new Date(epochMs) };
}

/** Localized event time-range formatter bound to the active UI locale. */
export function useFormatEventRange(): (event: EventTimes) => string {
  const locale = useLocale();
  return (event) => formatTimeRange(event, locale);
}

/**
 * Localized time-of-day formatter for when the event's date is shown elsewhere
 * (a day header, the Home "Today" section): clock times for a same-day event,
 * the translated "All day" for a single all-day event, the full range only when
 * it spans days. Avoids repeating a date the surrounding UI already shows.
 */
export function useFormatEventTime(): (event: EventTimes) => string {
  const locale = useLocale();
  const tc = useTranslations("mobile.calendar");
  return (event) => formatTimeOfDay(event, locale) || tc("allDay");
}

/** Localized relative time ("2 days ago" / "fa 2 dies"), older items show a date. */
export function useTimeAgo(): (epochMs: number) => string {
  const t = useTranslations("mobile.common");
  const locale = useLocale();
  return (epochMs) => {
    const parts = timeAgoParts(epochMs, Date.now());
    switch (parts.kind) {
      case "justNow":
        return t("timeAgoJustNow");
      case "minutes":
        return t("timeAgoMinutes", { minutes: parts.minutes });
      case "hours":
        return t("timeAgoHours", { hours: parts.hours });
      case "days":
        return t("timeAgoDays", { days: parts.days });
      case "date":
        return parts.date.toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          // Drop the year for same-year dates to keep the label short.
          year:
            parts.date.getFullYear() === new Date().getFullYear()
              ? undefined
              : "numeric",
        });
    }
  };
}

/** Localized, pluralized countdown to an event's start, or null once started. */
export function useTimeRemaining(): (
  event: EventTimes,
  now: number,
) => string | null {
  const t = useTranslations("mobile.calendar");
  return (event, now) => {
    const parts = timeRemainingParts(event, now);
    if (parts === null) {
      return null;
    }
    switch (parts.kind) {
      case "days":
        return t("timeRemainingDays", { days: parts.days });
      case "daysHours":
        return t("timeRemainingDaysHours", {
          days: parts.days,
          hours: parts.hours,
        });
      case "hours":
        return t("timeRemainingHours", { hours: parts.hours });
      case "oneHourMinutes":
        return t("timeRemainingOneHourMinutes", { minutes: parts.minutes });
      case "minutes":
        return t("timeRemainingMinutes", { minutes: parts.minutes });
    }
  };
}

/** Medium localized date for compact rows ("Thu, 5 Jun"). */
export function useMediumDate(): (date: Date) => string {
  const locale = useLocale();
  return (date) =>
    date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
}

/** Long localized date for the calendar day header ("Monday, 5 June"). */
export function useLongDate(): (date: Date) => string {
  const locale = useLocale();
  return (date) =>
    date.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
}

/** Localized "Month Year" label for the month grid. */
export function useMonthLabel(): (date: Date) => string {
  const locale = useLocale();
  return (date) =>
    date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

/** Monday-first short weekday names for the active locale (e.g. Mon…Sun). */
export function useWeekdayShortLabels(): string[] {
  const locale = useLocale();
  // 2024-01-01 is a Monday; format seven consecutive days from it.
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) =>
    formatter.format(new Date(2024, 0, 1 + i)),
  );
}
