"use client";

import { useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSubsectionItems } from "../use-menu-items";

export default function SubsectionTabs() {
  const subsectionItems = useSubsectionItems();
  const pathname = usePathname();

  const activeItem = useMemo(() => {
    const activeItems = subsectionItems.filter((item) =>
      pathname.startsWith(item.path),
    );
    return activeItems.length > 0 ? activeItems[activeItems.length - 1] : null;
  }, [subsectionItems, pathname]);

  if (subsectionItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-background/80 px-3 py-2 backdrop-blur-md md:hidden">
      <div className="flex gap-0.5 rounded-[15px] bg-muted p-[3px]">
        {subsectionItems.map((item) => {
          const isActive = activeItem?.path === item.path;

          if (item.href === "#") {
            return (
              <span key={item.path} className="flex-1">
                {item.name}
              </span>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.href as never}
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
