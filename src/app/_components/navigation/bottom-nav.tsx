"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenuItems } from "./use-menu-items";

export default function BottomNav() {
  const pathname = usePathname();
  const menuItems = useMenuItems();

  function isActive(path: string) {
    return path !== "/" && pathname.includes(path);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-row bg-background text-xs lg:hidden">
      {menuItems.map((item) => (
        <Link
          key={item.name}
          href={item.path}
          className={cn(
            "flex flex-grow flex-col items-center justify-center gap-2 p-2 text-primary",
            isActive(item.path) && "border-t-2 border-primary",
            item.disabled && "bg-muted text-muted-foreground",
          )}
        >
          {item.name}
          {item.icon}
        </Link>
      ))}
    </div>
  );
}
