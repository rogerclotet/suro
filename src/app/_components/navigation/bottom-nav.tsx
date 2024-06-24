"use client";

import { CookingPot, ListTodo } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

const menuItems: MenuItem[] = [
  {
    name: "Llistes",
    path: "/llistes",
    icon: <ListTodo />,
  },
  {
    name: "Receptes",
    path: "/receptes",
    icon: <CookingPot />,
    disabled: true,
  },
];

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
