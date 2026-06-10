"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THEME_OPTIONS = [
  { value: "light", icon: Sun, labelKey: "themeLight" },
  { value: "dark", icon: Moon, labelKey: "themeDark" },
  { value: "system", icon: SunMoon, labelKey: "themeSystem" },
] as const;

export default function ThemeSettings() {
  const t = useTranslations("profile");
  const tNav = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  // next-themes only knows the resolved theme on the client, so defer rendering
  // the active value until mounted to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-2">
      <Label className="font-medium text-base">{t("theme")}</Label>
      <Select value={mounted ? theme : undefined} onValueChange={setTheme}>
        <SelectTrigger>
          <SelectValue placeholder={tNav("chooseTheme")} />
        </SelectTrigger>
        <SelectContent>
          {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
            <SelectItem key={value} value={value}>
              <Icon className="size-4" />
              {tNav(labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-sm">{t("themeDescription")}</p>
    </div>
  );
}
