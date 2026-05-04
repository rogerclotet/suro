import type { MetadataRoute } from "next";
import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { type Locale, routing } from "@/i18n/routing";

function isLocale(value: string | undefined): value is Locale {
  return !!value && (routing.locales as readonly string[]).includes(value);
}

async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }

  return routing.defaultLocale;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    name: t("title"),
    short_name: t("appShortName"),
    description: t("description"),
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#1a0e08",
    background_color: "#1a0e08",
    lang: locale,
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-192x192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
