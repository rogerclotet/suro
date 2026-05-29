"use client";

import { ChevronRight, Moon, Sun, SunMoon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveMenuItem,
  useResponsiveMenu,
} from "@/components/ui/responsive-menu";
import { SidebarMenuSub, SidebarMenuSubButton } from "@/components/ui/sidebar";

export default function ThemeSwitcher() {
  const { setTheme } = useTheme();
  const { mode } = useResponsiveMenu();
  const t = useTranslations("nav");

  // On mobile the menu is a bottom-sheet drawer with no Radix menu context, so
  // the theme picker expands inline as large rows instead of a nested submenu.
  if (mode === "mobile") {
    return (
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div className="flex w-full cursor-pointer select-none items-center gap-3 rounded-md px-4 py-3 text-base outline-hidden transition-colors *:last:transition-transform active:bg-accent data-[state=open]:*:last:rotate-90 [&_svg:not([class*='size-'])]:size-5 [&_svg:not([class*='text-'])]:text-muted-foreground">
            <Sun className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span>{t("chooseTheme")}</span>
            <ChevronRight className="ml-auto" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-1 pl-3">
            <ResponsiveMenuItem onClick={() => setTheme("light")}>
              <Sun /> {t("themeLight")}
            </ResponsiveMenuItem>
            <ResponsiveMenuItem onClick={() => setTheme("dark")}>
              <Moon /> {t("themeDark")}
            </ResponsiveMenuItem>
            <ResponsiveMenuItem onClick={() => setTheme("system")}>
              <SunMoon /> {t("themeSystem")}
            </ResponsiveMenuItem>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Collapsible>
      <DropdownMenuSub>
        <CollapsibleTrigger asChild>
          <DropdownMenuSubTrigger className="*:last:transition-transform *:last:duration-200 data-[state=open]:*:last:rotate-90">
            <Sun className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span>{t("chooseTheme")}</span>
          </DropdownMenuSubTrigger>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubButton onClick={() => setTheme("light")}>
              <Sun /> {t("themeLight")}
            </SidebarMenuSubButton>
            <SidebarMenuSubButton onClick={() => setTheme("dark")}>
              <Moon /> {t("themeDark")}
            </SidebarMenuSubButton>
            <SidebarMenuSubButton onClick={() => setTheme("system")}>
              <SunMoon /> {t("themeSystem")}
            </SidebarMenuSubButton>
          </SidebarMenuSub>
        </CollapsibleContent>
      </DropdownMenuSub>
    </Collapsible>
  );
}
