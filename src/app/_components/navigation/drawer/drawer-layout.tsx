"use client";

import type { Project } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import ThemeSwitcher from "../../theme-switcher";
import Navbar from "../navbar";
import ProjectSelector from "../project-selector";

export default function DrawerLayout({
  projects,
  children,
}: {
  projects: Project[];
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const { selectedProjectId } = useSelectedProject();
  const [project, setProject] = React.useState<Project>();

  React.useEffect(() => {
    if (selectedProjectId) {
      setProject(projects.find((p) => p.id === selectedProjectId));
    }
  }, [selectedProjectId, projects]);

  function handleSelectProject(projectId: string) {
    setIsOpen(false);
    router.push(`/projectes/${projectId}/llistes`);
  }

  return (
    <div className="drawer flex flex-col items-center">
      <input
        id="menu-drawer"
        type="checkbox"
        checked={isOpen}
        onChange={() => setIsOpen(!isOpen)}
        className="drawer-toggle"
      />

      <nav className="navbar fixed z-40 w-full bg-primary text-primary-content lg:container lg:rounded-b-xl">
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
            {project?.name ?? "Família"}
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
          {children}

          <li>
            <ProjectSelector
              projects={projects}
              onSelect={handleSelectProject}
            />
          </li>

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
