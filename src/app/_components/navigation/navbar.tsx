"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenuItems } from "./use-menu-items";

export default function Navbar() {
  const pathname = usePathname();
  const menuItems = useMenuItems();

  function isActive(path: string) {
    return pathname.includes(path);
  }

  return (
    <ul className="menu menu-horizontal gap-2 p-0">
      {menuItems.map((item) => (
        <li key={item.path}>
          {item.disabled ? (
            <div className="btn btn-ghost no-animation cursor-default opacity-40">
              {item.name}
            </div>
          ) : (
            <Link
              href={item.disabled ? "" : item.path}
              className={`btn btn-ghost ${isActive(item.path) ? "underline underline-offset-4 [text-decoration-thickness:0.15em]" : ""}`}
            >
              {item.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
