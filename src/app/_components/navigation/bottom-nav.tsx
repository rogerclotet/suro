"use client";

import { menuItems } from "@/app/_data/menu-items";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="btm-nav text-xs lg:hidden">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`${pathname === item.path ? "active" : ""} text-primary ${item.disabled ? "disabled" : ""}`}
        >
          {item.name}
          {item.icon}
        </Link>
      ))}
    </div>
  );
}
