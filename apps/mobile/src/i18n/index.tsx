import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { IntlProvider } from "use-intl";
import {
  DEFAULT_LOCALE,
  type Locale,
  MESSAGES,
  normalizeLocale,
} from "./config";

/** The OS locale, read via Hermes' Intl (no extra native dependency). */
function deviceLocale(): Locale {
  try {
    return normalizeLocale(new Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return DEFAULT_LOCALE;
  }
}

function deviceTimeZone(): string | undefined {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/**
 * Provides translations via `use-intl` (the framework-agnostic core of the
 * web's next-intl, so messages and APIs match). The active locale is the user's
 * stored preference when signed in, otherwise the device locale — so the login
 * screen and first paint are localized before the user record loads.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.me);
  const locale: Locale = user?.locale
    ? normalizeLocale(user.locale)
    : deviceLocale();

  return (
    <IntlProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone={deviceTimeZone()}
    >
      {children}
    </IntlProvider>
  );
}

export { useFormatter, useLocale, useTranslations } from "use-intl";
export { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES, type Locale } from "./config";
