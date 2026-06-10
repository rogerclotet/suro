"use client";

import { Check, Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<Locale, string> = {
  ca: "Català",
  es: "Español",
  en: "English",
};

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button variant="ghost" size="icon" aria-label={LOCALE_LABELS[locale]}>
          <Languages />
        </Button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end">
        {routing.locales.map((l) => (
          <ResponsiveMenuItem
            key={l}
            onClick={() => {
              // next-intl's typed router rejects path templates with `[param]`
              // placeholders unless params are supplied; this switcher is only
              // mounted on no-param routes (landing, privacy), so the bare
              // pathname is safe here.
              router.replace(pathname as Parameters<typeof router.replace>[0], {
                locale: l,
              });
            }}
          >
            <Check className={l === locale ? "opacity-100" : "opacity-0"} />
            {LOCALE_LABELS[l]}
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
