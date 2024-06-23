import { Menu } from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "../theme-switcher";

export default function Navbar() {
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

        <div className="navbar-center hidden lg:flex"></div>

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

        <ul tabIndex={0} className="menu min-h-full w-80 bg-base-200 p-4">
          <li>
            <a>Item 1</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
