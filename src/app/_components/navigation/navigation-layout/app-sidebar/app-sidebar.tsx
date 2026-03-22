"use client";

import { BellIcon, LayoutGridIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useNotifications } from "@/app/_state/notification-state";
import CreateProjectForm from "@/app/grups/_components/create-project/create-project-form";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import ProjectSelector from "../../project-selector";
import Profile from "../profile/profile";
import NavApps from "./nav-apps";

export default function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const { totalUnread } = useNotifications();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <Link href="/" onClick={() => setOpenMobile(false)}>
        <SidebarHeader className="flex flex-row items-center gap-2 p-4 md:p-2">
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

            <Tooltip>
              <CreateProjectForm
                trigger={
                  <TooltipTrigger asChild>
                    <SidebarGroupAction>
                      <PlusIcon />
                      <span className="sr-only">Crear grup</span>
                    </SidebarGroupAction>
                  </TooltipTrigger>
                }
              />

              <TooltipContent side="right">Crear grup</TooltipContent>
            </Tooltip>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavApps />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/notificacions" onClick={() => setOpenMobile(false)}>
                <BellIcon />
                Notificacions
                {totalUnread > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                    {totalUnread}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Profile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
