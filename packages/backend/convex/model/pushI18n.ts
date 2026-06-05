/**
 * Server-rendered push copy. The OS shows a push notification while the app is
 * backgrounded, so the body must be localized here (per the recipient's stored
 * `locale`) rather than on the client. This is a small embedded subset of the
 * mobile `notifications` namespace — keep these keys in sync with
 * apps/mobile/src/i18n/messages/*.json. Only simple `{placeholder}`
 * interpolation is supported (no plurals or dates), so the event copy omits the
 * client's `{timeRange}`.
 */
type Locale = "ca" | "es" | "en";

const MESSAGES: Record<string, Record<Locale, string>> = {
  event_created: {
    en: "New event: {name}",
    ca: "Nou esdeveniment: {name}",
    es: "Nuevo evento: {name}",
  },
  list_created: {
    en: "New list: {name}",
    ca: "Nova llista: {name}",
    es: "Nueva lista: {name}",
  },
  note_created: {
    en: "New note: {name}",
    ca: "Nova nota: {name}",
    es: "Nueva nota: {name}",
  },
  pot_created: {
    en: "New pot created: {name}",
    ca: "Nou pot creat: {name}",
    es: "Nuevo bote creado: {name}",
  },
  spending_created: {
    en: "New expense: {amount}€",
    ca: "Nova despesa: {amount}€",
    es: "Nuevo gasto: {amount}€",
  },
  spending_created_with_description: {
    en: "New expense: {description} ({amount}€)",
    ca: "Nova despesa: {description} ({amount}€)",
    es: "Nuevo gasto: {description} ({amount}€)",
  },
};

function normalizeLocale(locale: string): Locale {
  return locale === "es" ? "es" : locale === "en" ? "en" : "ca";
}

export function localizeNotification(
  key: string,
  params: Record<string, string>,
  locale: string,
): string {
  const template = MESSAGES[key]?.[normalizeLocale(locale)];
  if (template === undefined) {
    return params.name ?? params.description ?? "";
  }
  return template.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? "");
}
