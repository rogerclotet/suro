import ca from "./messages/ca.json";
import en from "./messages/en.json";
import es from "./messages/es.json";

/** Supported interface languages, mirroring the web app's next-intl routing. */
export const LOCALES = ["ca", "es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ca";

/** Native display names, for the profile language selector. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ca: "Català",
  es: "Español",
  en: "English",
};

// All three locales share the same key shape (they're copied from the web app),
// so `en` defines the message type the others are checked against.
export type Messages = typeof en;
export const MESSAGES: Record<Locale, Messages> = { ca, es, en };

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Coerce a stored or device locale string (e.g. "en-GB", "es_ES") to a
 * supported locale, matching on the language subtag and falling back to the
 * app default.
 */
export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }
  if (isLocale(value)) {
    return value;
  }
  const language = value.split(/[-_]/)[0]?.toLowerCase() ?? "";
  return isLocale(language) ? language : DEFAULT_LOCALE;
}
