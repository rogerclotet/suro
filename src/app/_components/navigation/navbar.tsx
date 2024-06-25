"use client";

import { menuItems } from "@/app/_data/menu-items";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <ul className="menu menu-horizontal gap-2 p-0">
      {menuItems.map((item) => (
        <li key={item.path}>
          <Link
            href={item.disabled ? "" : item.path}
            className={`btn btn-ghost ${pathname === item.path ? "underline underline-offset-4 [text-decoration-thickness:0.15em]" : ""} ${item.disabled ? "cursor-default text-neutral-content" : ""}`}
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
