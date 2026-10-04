"use client";

import "@/styles/globals.css";
import "@fontsource/convergence/index.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import ErrorContent from "@/components/error-content";
import ca from "@/i18n/messages/ca.json";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { type Locale, routing } from "@/i18n/routing";

// This boundary replaces the locale layout, so it supplies its own styles and
// translations without relying on any of the providers that may have failed.
const messages = {
  ca: { common: ca.common, errors: ca.errors },
  es: { common: es.common, errors: es.errors },
  en: { common: en.common, errors: en.errors },
};

export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [locale, setLocale] = useState<Locale>(routing.defaultLocale);

  useEffect(() => {
    const segment = window.location.pathname.split("/")[1];
    if (hasLocale(routing.locales, segment)) setLocale(segment);
  }, []);

  return (
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages[locale]}
          timeZone="Europe/Madrid"
        >
          <ErrorContent {...props} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
