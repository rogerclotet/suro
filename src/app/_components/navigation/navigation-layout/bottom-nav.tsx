"use client";

import { useMemo, useState } from "react";
import { useNotifications } from "@/app/_state/notification-state";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import NotificationDot from "../../notifications/notification-dot";
import { type BottomNavItem, useBottomNavItems } from "../use-menu-items";
import MoreSheet from "./more-sheet";

export default function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const bottomNavItems = useBottomNavItems();
  const [moreOpen, setMoreOpen] = useState(false);
  const { hasUnreadInSections, totalUnread } = useNotifications();

  const activeItem = useMemo(() => {
    const activeItems = bottomNavItems.filter(
      (item) => item.path !== "#more" && pathname.startsWith(item.path),
    );
    return activeItems.length > 0 ? activeItems[activeItems.length - 1] : null;
  }, [bottomNavItems, pathname]);

  const overflowItems = useMemo(() => {
    const moreItem = bottomNavItems.find((item) => item.path === "#more");
    return (moreItem as BottomNavItem | undefined)?.overflow ?? [];
  }, [bottomNavItems]);

  return (
    <div className="md:hidden">
      <nav
        className={cn(
          "relative grid bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md",
          className,
        )}
        style={{
          gridTemplateColumns: `repeat(${bottomNavItems.length}, 1fr)`,
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 -top-3 h-3 bg-gradient-to-t from-background/70 to-transparent" />
        {bottomNavItems.map((item) => {
          const isMore = item.path === "#more";
          const isActive = !isMore && activeItem?.path === item.path;

          if (isMore) {
            const overflowSections =
              (item as BottomNavItem).overflow?.map((o) => o.section) ?? [];
            const hasOverflowUnread =
              hasUnreadInSections(overflowSections) || totalUnread > 0;

            return (
              <button
                key="more"
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors"
              >
                <div className="relative rounded-full px-4 py-1.5 [&_svg]:size-5">
                  {item.icon}
                  <NotificationDot count={hasOverflowUnread ? 1 : 0} />
                </div>
                <span className="text-xs">{item.name}</span>
              </button>
            );
          }

          if (item.disabled || item.href === "#") {
            return (
              <div
                key={item.name}
                className="flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground/50"
              >
                <div className="rounded-full px-4 py-1.5 [&_svg]:size-5">
                  {item.icon}
                </div>
                <span className="text-xs">{item.name}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href as never}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "rounded-full px-4 py-1.5 transition-colors [&_svg]:size-5",
                  isActive && "bg-primary/20",
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        overflowItems={overflowItems}
      />
    </div>
  );
}
