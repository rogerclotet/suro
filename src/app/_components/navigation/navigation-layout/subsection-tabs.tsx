"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSubsectionItems } from "../use-menu-items";

export default function SubsectionTabs() {
  const subsectionItems = useSubsectionItems();
  const pathname = usePathname();

  const activeItem = useMemo(() => {
    const activeItems = subsectionItems.filter((item) =>
      pathname.includes(item.path),
    );
    return activeItems.length > 0 ? activeItems[activeItems.length - 1] : null;
  }, [subsectionItems, pathname]);

  if (subsectionItems.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden bg-background/80 px-3 py-2 backdrop-blur-md">
      <div className="flex gap-0.5 rounded-[15px] bg-muted p-[3px]">
        {subsectionItems.map((item) => {
          const isActive = activeItem?.path === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex-1 rounded-[12px] px-3 py-[7px] text-center text-sm transition-all",
                isActive
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
