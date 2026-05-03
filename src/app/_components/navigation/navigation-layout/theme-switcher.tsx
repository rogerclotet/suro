"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
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
import { SidebarMenuSub, SidebarMenuSubButton } from "@/components/ui/sidebar";

export default function ThemeSwitcher() {
  const { setTheme } = useTheme();
  const t = useTranslations("nav");

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
