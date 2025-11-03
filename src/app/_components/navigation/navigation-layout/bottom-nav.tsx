"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMenuItems } from "../use-menu-items";

export default function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const menuItems = useMenuItems();
  const { isMobile } = useSidebar();

  const bottomNavItems = useMemo(() => {
    if (!isMobile) {
      return [];
    }

    const items = menuItems.filter(
      (item) =>
        item.path !== "/" && pathname.includes(item.path) && item.children,
    );

    if (items.length === 0) {
      return [];
    }

    items.push(...items.flatMap((item) => item.children ?? []));

    return items;
  }, [menuItems, isMobile, pathname]);

  const activeItem = useMemo(() => {
    const activeItems = bottomNavItems.filter((item) =>
      pathname.includes(item.path),
    );
    return activeItems.length > 0 ? activeItems[activeItems.length - 1] : null;
  }, [bottomNavItems, pathname]);

  if (!isMobile) {
    return null;
  }

  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(${bottomNavItems.length}, 1fr)`,
      }}
    >
      {bottomNavItems.map((item) =>
        item.disabled ? (
          <div
            key={item.name}
            className="flex flex-col items-center justify-center gap-2 bg-muted p-2 text-muted-foreground"
          >
            {item.name}
            {item.icon}
          </div>
        ) : (
          <Link
            key={item.name}
            href={item.path}
            className="flex flex-col items-center justify-center gap-1 p-1 text-primary text-sm"
          >
            <div
              className={cn(
                "rounded-full px-4 py-1.5",
                activeItem?.path === item.path && "bg-primary/20",
              )}
            >
              {item.icon}
            </div>
            {item.name}
          </Link>
        ),
      )}
    </div>
  );
}
