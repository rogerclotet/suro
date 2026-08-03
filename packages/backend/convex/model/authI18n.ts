/**
 * Server-rendered sign-in email copy. OTP emails are sent from the backend via
 * Resend, so the subject and body must be localized here (per the recipient's
 * locale) rather than on the client. Mirrors the pattern in `pushI18n.ts`.
 */
type Locale = "ca" | "es" | "en";

const MESSAGES: Record<string, Record<Locale, string>> = {
  subject: {
    en: "Your Suro sign-in code",
    ca: "El teu codi d'inici de sessió de Suro",
    es: "Tu código de inicio de sesión en Suro",
  },
  body: {
    en: "Your sign-in code for Suro is {code}.\n\nIt expires in 15 minutes. If you didn't request this, you can ignore this email.",
    ca: "El teu codi per iniciar sessió a Suro és {code}.\n\nCaduca en 15 minuts. Si no has demanat aquest codi, pots ignorar aquest correu.",
    es: "Tu código para iniciar sesión en Suro es {code}.\n\nCaduca en 15 minutos. Si no has solicitado este código, puedes ignorar este correo.",
  },
};

function normalizeLocale(locale: string): Locale {
  return locale === "es" ? "es" : locale === "en" ? "en" : "ca";
}

export function localizeAuthEmail(
  key: "subject" | "body",
  params: Record<string, string>,
  locale: string,
): string {
  const template = MESSAGES[key]?.[normalizeLocale(locale)];
  if (template === undefined) {
    return params.code ?? "";
  }
  return template.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? "");
}
