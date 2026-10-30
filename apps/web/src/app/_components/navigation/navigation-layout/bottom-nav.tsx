"use client";

import { useMemo } from "react";
import { useProjects } from "@/app/_state/project-state";
import { UnreadBadge } from "@/components/unread-badge";
import { Link, usePathname } from "@/i18n/navigation";
import {
  menuSection,
  type UnreadSection,
  unreadCount,
  unreadElsewhere,
} from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";
import { cn } from "@/lib/utils";
import { type BottomNavItem, useBottomNavItems } from "../use-menu-items";

/**
 * Home adds up the sections reached from its chips. The group switcher counts
 * every other group, plus this group's members, whose settings it links to.
 */
function itemUnread(
  unread: readonly UnreadSection[],
  projectId: string,
  item: BottomNavItem,
) {
  if (item.section === "groups") {
    return (
      unreadElsewhere(unread, projectId) +
      unreadCount(unread, projectId, "members")
    );
  }
  if (item.section === "home") return unreadCount(unread, projectId, "home");
  const section = menuSection(item.section);
  return section ? unreadCount(unread, projectId, section) : 0;
}

export default function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const bottomNavItems = useBottomNavItems();
  const unread = useUnreadNotifications();
  const { project } = useProjects();

  const activeItem = useMemo(() => {
    const activeItems = bottomNavItems.filter((item) =>
      pathname.startsWith(item.path),
    );
    return activeItems.length > 0 ? activeItems[activeItems.length - 1] : null;
  }, [bottomNavItems, pathname]);

  return (
    <div className="md:hidden">
      <nav
        className={cn(
          "grid bg-sidebar/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md",
          className,
        )}
        style={{
          gridTemplateColumns: `repeat(${bottomNavItems.length}, 1fr)`,
        }}
      >
        {bottomNavItems.map((item) => {
          const isActive = activeItem?.path === item.path;

          if (item.disabled || item.href === "#") {
            return (
              <div
                key={item.path}
                className="flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground/50"
              >
                <div className="rounded-full px-4 py-1.5 [&_svg]:size-5">
                  {item.icon}
                </div>
                <span className="max-w-full truncate px-1 text-xs">
                  {item.name}
                </span>
              </div>
            );
          }

          const count = project ? itemUnread(unread, project.id, item) : 0;
          return (
            <Link
              key={item.path}
              href={item.href as never}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "relative rounded-full px-4 py-1.5 transition-colors [&_svg]:size-5",
                  isActive && "bg-primary/20",
                )}
              >
                {item.icon}
                <UnreadBadge
                  count={count}
                  className="absolute -top-1 right-1"
                />
              </div>
              <span className="max-w-full truncate px-1 text-xs">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
