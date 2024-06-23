import { Menu } from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "./theme-switcher";

export default function Navbar() {
  return (
    <nav className="navbar bg-primary text-primary-content lg:container lg:rounded-b-xl">
      <div className="navbar-start">
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost text-xl lg:hidden"
          >
            <Menu />
          </div>
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
  );
}
