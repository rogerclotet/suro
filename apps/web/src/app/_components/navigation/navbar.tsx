"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { useMenuItems } from "./use-menu-items";

export default function Navbar() {
  const pathname = usePathname();
  const menuItems = useMenuItems();

  function isActive(path: string) {
    return path !== "/" && pathname.startsWith(path);
  }

  return (
    <div className="flex flex-row items-center gap-2">
      {menuItems.map((item) => {
        if (item.disabled || item.href === "#") {
          return (
            <Button key={item.name} variant="ghost" disabled>
              {item.name}
            </Button>
          );
        }

        return (
          <Button key={item.name} variant="ghost" asChild>
            <Link
              href={item.href as never}
              className={
                isActive(item.path)
                  ? "underline decoration-[0.15em] underline-offset-4"
                  : ""
              }
            >
              {item.name}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
