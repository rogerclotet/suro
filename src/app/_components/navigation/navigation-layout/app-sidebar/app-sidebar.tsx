"use client";

import { LayoutGridIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import ProjectSelector from "../../project-selector";
import Profile from "../profile/profile";
import NavApps from "./nav-apps";

export default function AppSidebar() {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <Link href="/" onClick={() => setOpenMobile(false)}>
        <SidebarHeader className="flex flex-row items-center gap-2 p-4">
          <Image src="/favicon.png" alt="Logo" width={32} height={32} />
          <span className="truncate font-bold text-xl">Família</span>
        </SidebarHeader>
      </Link>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Grups</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <ProjectSelector />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/grups" onClick={() => setOpenMobile(false)}>
                    <LayoutGridIcon />
                    Gestionar grups
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavApps />
      </SidebarContent>

      <SidebarFooter>
        <Profile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
