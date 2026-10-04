import "@/styles/globals.css";
import "@fontsource/convergence/index.css";
import { createTranslator } from "next-intl";
import NotFoundContent from "@/components/not-found-content";
import messages from "@/i18n/messages/ca.json";
import { routing } from "@/i18n/routing";

export default function RootNotFound() {
  const t = createTranslator({
    locale: routing.defaultLocale,
    messages,
    namespace: "errors",
  });

  return (
    <html lang={routing.defaultLocale} className="dark">
      <head>
        <title>{`404 · ${t("notFound")} · Suro`}</title>
      </head>
      <body>
        <NotFoundContent
          locale={routing.defaultLocale}
          title={t("notFound")}
          description={t("notFoundDescription")}
          homeLabel={t("backHome")}
        />
      </body>
    </html>
  );
}
