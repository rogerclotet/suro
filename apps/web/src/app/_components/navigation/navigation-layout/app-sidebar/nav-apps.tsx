"use client";

import { ChevronRightIcon, SquircleIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProjects } from "@/app/_state/project-state";
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UnreadBadge } from "@/components/unread-badge";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { menuSection, unreadCount } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";
import { cn } from "@/lib/utils";
import {
  type MenuItem,
  type MenuItemHref,
  useMenuItems,
} from "../../use-menu-items";

export default function NavApps() {
  const menuItems = useMenuItems();
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const unread = useUnreadNotifications();
  const { project } = useProjects();
  // Every section has its own entry here, so Home carries no aggregate badge.
  function countFor(item: MenuItem) {
    const section = menuSection(item.section);
    return project && section ? unreadCount(unread, project.id, section) : 0;
  }

  const shouldDisplayChildrenInSidebar = useMemo(() => {
    return !isMobile && state === "expanded";
  }, [isMobile, state]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Apps</SidebarGroupLabel>
      <SidebarGroupContent>
        {menuItems.map((item) => {
          const isItemActive =
            item.path !== "#" && pathname.startsWith(item.path);
          const count = countFor(item);

          return (
            <SidebarMenuItem key={`${item.name}-${item.path}`}>
              {item.children && shouldDisplayChildrenInSidebar ? (
                <CollapsibleNavItem
                  item={item}
                  pathname={pathname}
                  count={count}
                  onNavigate={() => setOpenMobile(false)}
                />
              ) : (
                <>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.name}
                    isActive={isItemActive}
                  >
                    <NavLink
                      href={item.href}
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                  {count ? (
                    <SidebarMenuBadge>
                      <UnreadBadge count={count} />
                    </SidebarMenuBadge>
                  ) : null}
                </>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CollapsibleNavItem({
  item,
  pathname,
  count,
  onNavigate,
}: {
  item: MenuItem;
  pathname: string;
  count: number;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const inSection = item.path !== "#" && pathname.startsWith(item.path);
  const [open, setOpen] = useState(inSection);

  useEffect(() => {
    if (inSection) {
      setOpen(true);
    }
  }, [inSection]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (
      nextOpen &&
      item.href !== "#" &&
      !isParentSubItemActive(pathname, item)
    ) {
      router.push(item.href as never);
      onNavigate();
    }
  };

  return (
    <SidebarMenu>
      <Collapsible
        open={open}
        onOpenChange={handleOpenChange}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.name} isActive={false}>
              {item.icon}
              <span>{item.name}</span>
              <UnreadBadge count={count} className="ml-auto" />
              <ChevronRightIcon
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  !count && "ml-auto",
                  "group-data-[state=open]/collapsible:rotate-90",
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={isParentSubItemActive(pathname, item)}
                >
                  <NavLink href={item.href} onClick={onNavigate}>
                    <SquircleIcon />
                    <span>{item.name}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>

              {item.children?.map((child) => (
                <SidebarMenuSubItem key={child.name}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname.startsWith(child.path)}
                  >
                    <NavLink href={child.href} onClick={onNavigate}>
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
  );
}

/** Highlights the section root child, not nested child routes like templates. */
function isParentSubItemActive(pathname: string, item: MenuItem): boolean {
  if (pathname === item.path) {
    return true;
  }
  if (!pathname.startsWith(`${item.path}/`)) {
    return false;
  }
  return !item.children?.some((child) => pathname.startsWith(child.path));
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
