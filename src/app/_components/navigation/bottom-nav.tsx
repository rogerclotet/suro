"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMenuItems } from "./use-menu-items";

export default function BottomNav() {
  const pathname = usePathname();
  const menuItems = useMenuItems();

  function isActive(path: string) {
    return path !== "/" && pathname.includes(path);
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 flex flex-row bg-background text-xs lg:hidden">
      {menuItems.map((item) =>
        item.disabled ? (
          <div
            key={item.name}
            className="flex grow flex-col items-center justify-center gap-2 bg-muted p-2 text-muted-foreground"
          >
            {item.name}
            {item.icon}
          </div>
        ) : (
          <Link
            key={item.name}
            href={item.path}
            className={cn(
              "flex grow flex-col items-center justify-center gap-2 p-2 text-primary",
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
