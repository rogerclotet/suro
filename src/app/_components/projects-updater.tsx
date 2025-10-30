"use client";

import { useEffect } from "react";
import type { Project } from "../_data/project";
import { useProjects } from "../_state/project-state";

export default function ProjectsUpdater({ projects }: { projects: Project[] }) {
  const { setProjects } = useProjects();

  useEffect(() => {
    setProjects(projects);
  }, [projects, setProjects]);

  return null;
}
