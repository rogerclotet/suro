"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import React from "react";
import ThemeSwitcher from "../../theme-switcher";
import Navbar from "../navbar";
import ProjectSelector from "../project-dropdown";

export default function DrawerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="drawer flex flex-col items-center">
      <input
        id="menu-drawer"
        type="checkbox"
        checked={isOpen}
        onChange={() => setIsOpen(!isOpen)}
        className="drawer-toggle"
      />

      <nav className="navbar w-full bg-primary text-primary-content lg:container lg:rounded-b-xl">
        <div className="navbar-start">
          <div className="dropdown">
            <label
              htmlFor="menu-drawer"
              tabIndex={0}
              role="button"
              className="btn btn-ghost text-xl"
              aria-label="Obrir menú lateral"
            >
              <Menu />
            </label>
          </div>

          <Link href="/" className="btn btn-ghost text-xl">
            Família
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <Navbar />
        </div>

        <div className="navbar-end">
          <ThemeSwitcher />
        </div>
      </nav>

      <div className="drawer-side z-50">
        <label
          htmlFor="menu-drawer"
          aria-label="Tancar menú lateral"
          className="drawer-overlay"
        ></label>

        <ul tabIndex={0} className="menu min-h-full w-80 gap-2 bg-base-200 p-4">
          <li>{children}</li>

          <ProjectSelector />

          <li>
            <Link href="/projectes" onClick={() => setIsOpen(false)}>
              Gestionar projectes
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
