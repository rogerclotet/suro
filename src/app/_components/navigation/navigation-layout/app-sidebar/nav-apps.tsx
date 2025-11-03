"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMenuItems } from "../../use-menu-items";

export default function NavApps() {
  const menuItems = useMenuItems();
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();

  const shouldDisplayChildrenInSidebar = useMemo(() => {
    return !isMobile && state === "expanded";
  }, [isMobile, state]);

  const activeParent = useMemo(() => {
    return menuItems.find((item) => pathname.includes(item.path));
  }, [menuItems, pathname]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Apps</SidebarGroupLabel>
      <SidebarGroupContent>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.name}>
            {item.children && shouldDisplayChildrenInSidebar ? (
              <SidebarMenu>
                <Collapsible
                  key={item.name}
                  asChild
                  defaultOpen={activeParent === item}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.name}>
                        {item.icon}
                        <span>{item.name}</span>
                        <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={item.path}
                              onClick={() => setOpenMobile(false)}
                            >
                              {item.icon}
                              <span>{item.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.name}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                href={child.path}
                                onClick={() => setOpenMobile(false)}
                              >
                                {child.icon}
                                <span>{child.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            ) : (
              <SidebarMenuButton asChild tooltip={item.name}>
                <Link href={item.path} onClick={() => setOpenMobile(false)}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
