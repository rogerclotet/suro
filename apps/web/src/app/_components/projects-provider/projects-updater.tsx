"use client";

import { type ReactNode, useEffect } from "react";
import type { Project } from "../../_data/project";
import { useProjects } from "../../_state/project-state";

export default function ProjectsUpdater({
  projects,
  children,
}: {
  projects: Project[];
  children: ReactNode;
}) {
  const { setProjects } = useProjects();

  useEffect(() => {
    setProjects(projects);
  }, [projects, setProjects]);

  return children;
}
