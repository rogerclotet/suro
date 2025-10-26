"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMenuItems } from "./use-menu-items";

export default function Navbar() {
  const pathname = usePathname();
  const menuItems = useMenuItems();

  function isActive(path: string) {
    return path !== "/" && pathname.includes(path);
  }

  return (
    <div className="flex flex-row items-center gap-2">
      {menuItems.map((item) => {
        if (item.disabled) {
          return (
            <Button key={item.name} variant="ghost" disabled>
              {item.name}
            </Button>
          );
        }

        return (
          <Button key={item.name} variant="ghost" asChild>
            <Link
              href={item.path}
              className={
                isActive(item.path)
                  ? "underline underline-offset-4 [text-decoration-thickness:0.15em]"
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
