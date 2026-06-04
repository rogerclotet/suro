import { useFormatter, useLocale, useTranslations } from "@/i18n";
import {
  type EventTimes,
  formatTimeRange,
  timeRemainingParts,
} from "@/lib/event-dates";

/** Localized event time-range formatter bound to the active UI locale. */
export function useFormatEventRange(): (event: EventTimes) => string {
  const locale = useLocale();
  return (event) => formatTimeRange(event, locale);
}

/** Localized relative time ("2 days ago" / "fa 2 dies"), via Intl.RelativeTimeFormat. */
export function useTimeAgo(): (epochMs: number) => string {
  const format = useFormatter();
  return (epochMs) => format.relativeTime(new Date(epochMs));
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
