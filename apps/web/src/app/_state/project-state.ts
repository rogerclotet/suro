"use client";

import { createContext, useContext } from "react";
import type { Project } from "@/app/_data/project";

export type ProjectState = {
  projects: Project[];
  project: Project | null;
  selectProject: (project: Project | undefined) => void;
  isAdmin: boolean;
};

export const ProjectsContext = createContext<ProjectState | null>(null);

/** Read-only consumption; the provider owns subscription and persistence effects. */
export function useProjects(): ProjectState {
  const state = useContext(ProjectsContext);
  if (!state) throw new Error("useProjects requires ProjectsProvider");
  return state;
}
