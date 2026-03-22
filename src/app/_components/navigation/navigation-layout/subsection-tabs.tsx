"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSubsectionItems } from "../use-menu-items";

export default function SubsectionTabs() {
  const subsectionItems = useSubsectionItems();
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const activeItem = useMemo(() => {
    const activeItems = subsectionItems.filter((item) =>
      pathname.includes(item.path),
    );
    return activeItems.length > 0 ? activeItems[activeItems.length - 1] : null;
  }, [subsectionItems, pathname]);

  if (!isMobile || subsectionItems.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-1 overflow-x-auto border-border/50 border-b bg-background/80 px-3 backdrop-blur-md">
      {subsectionItems.map((item) => {
        const isActive = activeItem?.path === item.path;

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
