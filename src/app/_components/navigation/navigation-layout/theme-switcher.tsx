"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
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

  return (
    <Collapsible>
      <DropdownMenuSub>
        <CollapsibleTrigger asChild>
          <DropdownMenuSubTrigger className="*:last:transition-transform *:last:duration-200 data-[state=open]:*:last:rotate-90">
            <Sun className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span>Triar tema</span>
          </DropdownMenuSubTrigger>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubButton onClick={() => setTheme("light")}>
              <Sun /> Clar
            </SidebarMenuSubButton>
            <SidebarMenuSubButton onClick={() => setTheme("dark")}>
              <Moon /> Fosc
            </SidebarMenuSubButton>
            <SidebarMenuSubButton onClick={() => setTheme("system")}>
              <SunMoon /> Sistema
            </SidebarMenuSubButton>
          </SidebarMenuSub>
        </CollapsibleContent>
      </DropdownMenuSub>
    </Collapsible>
  );
}
