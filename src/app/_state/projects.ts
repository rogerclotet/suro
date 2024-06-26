import type {} from "@redux-devtools/extension"; // required for devtools typing
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Project } from "../_data/project";

interface ProjectsState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (project: Project) => void;
  selectedProjectId: number;
  selectProject: (projectId: number) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      projects: [],
      setProjects: (projects) => set({ projects }),
      addProject: (project) => set({ projects: [...get().projects, project] }),
      removeProject: (project) =>
        set({ projects: get().projects.filter((p) => p.id !== project.id) }),
      selectedProjectId: -1,
      selectProject: (projectId) => set({ selectedProjectId: projectId }),
      isLoading: true,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    { name: "ProjectsStore" },
  ),
);
