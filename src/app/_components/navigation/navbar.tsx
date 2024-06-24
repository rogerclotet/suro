import { auth, signOut } from "@/auth";
import { Menu } from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "../theme-switcher";
import ProjectDropdown from "./project-dropdown";

export default async function Navbar() {
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

        <ul tabIndex={0} className="menu min-h-full w-80 gap-2 bg-base-200 p-4">
          <li>
            <details className="dropdown">
              <summary>
                <div className="flex flex-row items-center justify-between gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={session.user.image!}
                    alt={session.user.name!}
                    className="h-8 w-8 rounded-full border-2"
                  />
                  {session.user.name}
                </div>
              </summary>
              <ul
                tabIndex={0}
                className="menu mt-2 w-full gap-2 rounded-l-xl bg-base-300"
              >
                <li>
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button>Tancar sessió</button>
                  </form>
                </li>
              </ul>
            </details>
          </li>

          <li>
            <ProjectDropdown />
          </li>

          <li>
            <a>Item 1</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
