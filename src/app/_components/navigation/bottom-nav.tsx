"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMenuItems } from "./use-menu-items";

export default function BottomNav() {
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

  function isActive(path: string) {
    return pathname === path;
  }

  if (!isMobile) {
    return null;
  }

  return (
    <div
      className={`fixed right-0 bottom-0 left-0 z-40 grid bg-background text-shadow-xs`}
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
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-2 text-primary",
              isActive(item.path) && "border-primary border-t-2",
            )}
          >
            {item.name}
            {item.icon}
          </Link>
        ),
      )}
    </div>
  );
}
