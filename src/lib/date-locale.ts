import type { Locale } from "date-fns";
import { ca, enUS } from "date-fns/locale";

export const DATE_LOCALE_OPTIONS = [
  {
    value: "ca-ES",
    label: "Català (23/02/2026)",
  },
  {
    value: "en-US",
    label: "English (2/23/2026)",
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
