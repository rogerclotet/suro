"use client";

import { ChevronRightIcon, SquircleIcon } from "lucide-react";
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
import { Link, usePathname } from "@/i18n/navigation";
import { type MenuItemHref, useMenuItems } from "../../use-menu-items";

export default function NavApps() {
  const menuItems = useMenuItems();
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();

  const shouldDisplayChildrenInSidebar = useMemo(() => {
    return !isMobile && state === "expanded";
  }, [isMobile, state]);

  const activeParent = useMemo(() => {
    return menuItems.find(
      (item) => item.path !== "#" && pathname.startsWith(item.path),
    );
  }, [menuItems, pathname]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Apps</SidebarGroupLabel>
      <SidebarGroupContent>
        {menuItems.map((item) => (
          <SidebarMenuItem key={`${item.name}-${item.path}`}>
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
                            <NavLink
                              href={item.href}
                              onClick={() => setOpenMobile(false)}
                            >
                              <SquircleIcon />
                              <span>{item.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.name}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                href={child.href}
                                onClick={() => setOpenMobile(false)}
                              >
                                {child.icon}
                                <span>{child.name}</span>
                              </NavLink>
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
                <NavLink href={item.href} onClick={() => setOpenMobile(false)}>
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavLink({
  href,
  onClick,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"a">, "href"> & {
  href: MenuItemHref;
  onClick: () => void;
}) {
  if (href === "#") {
    return (
      <button
        type="button"
        onClick={onClick}
        {...(props as React.ComponentPropsWithoutRef<"button">)}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href={href as never} onClick={onClick} {...(props as object)}>
      {children}
    </Link>
  );
}
