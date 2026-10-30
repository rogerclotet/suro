"use client";

import { LayoutGridIcon, MessageSquarePlusIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useFeedback } from "@/app/_state/feedback-state";
import CreateProjectForm from "@/app/[locale]/groups/_components/create-project/create-project-form";
import { SidebarAppLinks } from "@/components/sidebar-app-links";
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
  SidebarMenuBadge,
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
import { UnreadBadge } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { unreadInSection } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";
import ProjectSelector from "../../project-selector";
import Profile from "../profile/profile";
import NavApps from "./nav-apps";

export default function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const { openFeedback } = useFeedback();
  const tNav = useTranslations("nav");
  const tGroups = useTranslations("groups");
  const unread = useUnreadNotifications();
  // Joins and leaves are read on each group's settings, linked from here.
  const membersUnread = unreadInSection(unread, "members");

  return (
    <Sidebar variant="inset" collapsible="icon">
      <Link href="/" onClick={() => setOpenMobile(false)}>
        <SidebarHeader className="flex flex-row items-center gap-2 p-4 md:p-2">
          <Image src="/logo.png" alt="Suro" width={32} height={32} />
          <span className="truncate font-display text-xl font-bold">Suro</span>
        </SidebarHeader>
      </Link>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{tNav("groups")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <ProjectSelector />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/groups" onClick={() => setOpenMobile(false)}>
                    <LayoutGridIcon />
                    {tNav("manageGroups")}
                  </Link>
                </SidebarMenuButton>
                {membersUnread ? (
                  <SidebarMenuBadge>
                    <UnreadBadge count={membersUnread} />
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>

            <Tooltip>
              <CreateProjectForm
                trigger={
                  <TooltipTrigger asChild>
                    <SidebarGroupAction>
                      <PlusIcon />
                      <span className="sr-only">{tGroups("createTitle")}</span>
                    </SidebarGroupAction>
                  </TooltipTrigger>
                }
              />

              <TooltipContent side="right">
                {tGroups("createTitle")}
              </TooltipContent>
            </Tooltip>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavApps />
      </SidebarContent>

      <SidebarFooter>
        <SidebarAppLinks />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={openFeedback}>
              <MessageSquarePlusIcon />
              {tNav("feedback")}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Profile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
