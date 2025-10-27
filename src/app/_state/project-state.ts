import type { } from "@redux-devtools/extension"; // required for devtools typing
import React from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Project } from "../_data/project";

interface ProjectState {
  projects: Project[];
  project: Project | null;
  projectId: string | null;
  setProjects: (projects: Project[]) => void;
  selectProject: (project: Project | undefined) => void;
  selectProjectId: (projectId: string) => void;
  addCategory: (category: Project["categories"][number]) => void;
}

const useProjectsStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      projects: [],
      project: null,
      projectId: null,
      setProjects: (projects) => set({ projects }),
      selectProject: (project) => set({ project }),
      selectProjectId: (projectId) => set({ projectId: projectId }),
      addCategory: (category) => {
        const p = get().project;
        if (!p) {
          return;
        }
        set({
          project: {
            ...p,
            categories: [...p.categories, category],
          },
        });
      },
    }),
    { name: "ProjectsStore" },
  ),
);

export function useProjects() {
  const setProjects = useProjectsStore((state) => state.setProjects);
  const projects = useProjectsStore((state) => state.projects);
  const project = useProjectsStore((state) => state.project);
  const selectProjectInStore = useProjectsStore((state) => state.selectProject);
  const projectId = useProjectsStore((state) => state.projectId);
  const selectProjectId = useProjectsStore((state) => state.selectProjectId);
  const addCategory = useProjectsStore((state) => state.addCategory);

  React.useEffect(() => {
    const projectId = localStorage.getItem("selectedProjectId");
    if (projectId) {
      selectProjectId(projectId);
    }
  }, []);

  React.useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    const projectId = localStorage.getItem("selectedProjectId");
    if (projectId) {
      const p = projects.find((p) => p.id === projectId);
      if (p) {
        selectProjectInStore(p);
        selectProjectId(projectId);
        return;
      }
    }

    selectProjectInStore(projects[0]);
    selectProjectId(projects[0]!.id);
  }, [projects, selectProjectInStore, selectProjectId]);

  function selectProject(project: Project | undefined) {
    if (project === undefined) {
      let projectToSelect = projects[0];
      if (projectId) {
        const p = projects.find((p) => p.id === projectId);
        if (p) {
          projectToSelect = p;
        }
      }

      selectProjectInStore(projectToSelect);
      return;
    }

    localStorage.setItem("selectedProjectId", project.id);
    selectProjectInStore(project);
    selectProjectId(project.id);
  }

  return { setProjects, projects, project, selectProject, addCategory };
}
