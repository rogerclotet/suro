import { createTranslator, hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

const messageCache = new Map<Locale, Record<string, unknown>>();

async function loadMessages(locale: Locale) {
  const cached = messageCache.get(locale);
  if (cached) return cached;
  const mod = await import(`@/i18n/messages/${locale}.json`);
  const messages = mod.default as Record<string, unknown>;
  messageCache.set(locale, messages);
  return messages;
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export async function getNotificationTranslator(
  locale: string | null | undefined,
) {
  const normalized = normalizeLocale(locale);
  const messages = await loadMessages(normalized);
  return createTranslator({
    locale: normalized,
    messages,
    namespace: "notifications",
  });
}

export async function translateNotificationBody(
  type: string,
  params: Record<string, unknown> | null | undefined,
  locale: string | null | undefined,
  fallback?: string,
): Promise<string> {
  try {
    const t = await getNotificationTranslator(locale);
    // @ts-expect-error - dynamic notification key
    return t(type, (params ?? {}) as Record<string, unknown>);
  } catch {
    return fallback ?? "";
  }
}

export async function buildLocalizedUrl(
  path: string,
  locale: Locale,
): Promise<string> {
  if (path.startsWith("/")) {
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      return path;
    }
    return `/${locale}${path}`;
  }
  return path;
}
