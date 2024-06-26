import { auth } from "@/auth";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import ThemeSwitcher from "../theme-switcher";
import DrawerMenu from "./drawer-menu";
import Navbar from "./navbar";

export default async function Drawer() {
  const session = await auth();

  if (!session) {
    return null;
  }

  return (
    <div className="drawer flex flex-col items-center">
      <input id="menu-drawer" type="checkbox" className="drawer-toggle" />

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

      <div className="drawer-side">
        <label
          htmlFor="menu-drawer"
          aria-label="Tancar menú lateral"
          className="drawer-overlay"
        ></label>
        <Suspense fallback={null}>
          <DrawerMenu />
        </Suspense>
      </div>
    </div>
  );
}
