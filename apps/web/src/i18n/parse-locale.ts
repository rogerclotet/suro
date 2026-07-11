import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { type Locale, routing } from "./routing";

/** Validates an App Router locale segment; calls `notFound()` when unsupported. */
export function parseLocaleParam(value: string): Locale {
  if (!hasLocale(routing.locales, value)) {
    notFound();
  }
  return value;
}
