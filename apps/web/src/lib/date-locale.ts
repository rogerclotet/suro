import type { Locale } from "date-fns";
import { ca, enUS, es } from "date-fns/locale";
import type { routing } from "@/i18n/routing";

export const DATE_LOCALE_OPTIONS = [
  {
    value: "ca-ES",
    label: "DD/MM/AAAA",
  },
  {
    value: "en-US",
    label: "MM/DD/AAAA",
  },
] as const;

export type AppDateLocale = (typeof DATE_LOCALE_OPTIONS)[number]["value"];

export const DATE_LOCALE_VALUES = DATE_LOCALE_OPTIONS.map(
  (option) => option.value,
) as [AppDateLocale, ...AppDateLocale[]];

export const DEFAULT_DATE_LOCALE: AppDateLocale = "ca-ES";

export function normalizeDateLocale(locale?: string | null): AppDateLocale {
  return DATE_LOCALE_VALUES.includes(locale as AppDateLocale)
    ? (locale as AppDateLocale)
    : DEFAULT_DATE_LOCALE;
}

export function getDateFnsLocale(locale?: string | null): Locale {
  switch (normalizeDateLocale(locale)) {
    case "en-US":
      return enUS;
    default:
      return ca;
  }
}

/**
 * Map a UI locale (`ca` / `es` / `en`) to the matching date-fns Locale,
 * used for translating month names, day names, and relative-time strings.
 * Independent of the user's date-format preference (DD/MM vs MM/DD).
 */
export function getDateFnsLocaleForUi(
  uiLocale: (typeof routing.locales)[number],
): Locale {
  switch (uiLocale) {
    case "es":
      return es;
    case "en":
      return enUS;
    default:
      return ca;
  }
}

export function formatLocalizedDateData(
  date: Date,
  locale?: string | null,
): string {
  return new Intl.DateTimeFormat(normalizeDateLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatLocalizedLongDate(
  date: Date,
  locale?: string | null,
): string {
  return new Intl.DateTimeFormat(normalizeDateLocale(locale), {
    dateStyle: "long",
  }).format(date);
}

export function formatLocalizedShortMonth(
  date: Date,
  locale?: string | null,
): string {
  return new Intl.DateTimeFormat(normalizeDateLocale(locale), {
    month: "short",
  }).format(date);
}

export function parseDateOnly(value: string): Date {
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return new Date(Number.NaN);
  }

  return new Date(year, month - 1, day);
}
