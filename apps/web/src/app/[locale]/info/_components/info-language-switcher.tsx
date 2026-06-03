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
import type { Locale } from "@/i18n/routing";

const SUPPORTED = ["ca", "en"] as const;
type SupportedLocale = (typeof SUPPORTED)[number];

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  ca: "Català",
  en: "English",
};

function isSupported(locale: string): locale is SupportedLocale {
  return (SUPPORTED as readonly string[]).includes(locale);
}

export default function InfoLanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale: SupportedLocale = isSupported(locale) ? locale : "en";

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          aria-label={LOCALE_LABELS[activeLocale]}
        >
          <Languages />
        </Button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end">
        {SUPPORTED.map((l) => (
          <ResponsiveMenuItem
            key={l}
            onClick={() => {
              router.replace(pathname as Parameters<typeof router.replace>[0], {
                locale: l,
              });
            }}
          >
            <Check
              className={l === activeLocale ? "opacity-100" : "opacity-0"}
            />
            {LOCALE_LABELS[l]}
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
