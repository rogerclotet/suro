"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type BottomNavItem, useBottomNavItems } from "../use-menu-items";
import MoreSheet from "./more-sheet";

export default function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const bottomNavItems = useBottomNavItems();
  const { isMobile } = useSidebar();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeItem = useMemo(() => {
    const activeItems = bottomNavItems.filter(
      (item) => item.path !== "#more" && pathname.includes(item.path),
    );
    return activeItems.length > 0 ? activeItems[activeItems.length - 1] : null;
  }, [bottomNavItems, pathname]);

  const overflowItems = useMemo(() => {
    const moreItem = bottomNavItems.find((item) => item.path === "#more");
    return (moreItem as BottomNavItem | undefined)?.overflow ?? [];
  }, [bottomNavItems]);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      <nav
        className={cn(
          "grid border-t border-border bg-background pb-[env(safe-area-inset-bottom)]",
          className,
        )}
        style={{
          gridTemplateColumns: `repeat(${bottomNavItems.length}, 1fr)`,
        }}
      >
        {bottomNavItems.map((item) => {
          const isMore = item.path === "#more";
          const isActive = !isMore && activeItem?.path === item.path;

          if (isMore) {
            return (
              <button
                key="more"
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors"
              >
                <div className="rounded-full px-4 py-1.5 [&_svg]:size-5">
                  {item.icon}
                </div>
                <span className="text-xs">{item.name}</span>
              </button>
            );
          }

          if (item.disabled) {
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
              href={item.path}
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
    </>
  );
}
