"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenuItems } from "./use-menu-items";

export default function BottomNav() {
  const pathname = usePathname();
  const menuItems = useMenuItems();

  function isActive(path: string) {
    return pathname.includes(path);
  }

  return (
    <div className="btm-nav z-40 text-xs lg:hidden">
      {menuItems.map((item) => (
        <Link
          key={item.name}
          href={item.path}
          className={`${isActive(item.path) ? "active" : ""} text-primary ${item.disabled ? "disabled" : ""}`}
        >
          {item.name}
          {item.icon}
        </Link>
      ))}
    </div>
  );
}
