import type {} from "@redux-devtools/extension"; // required for devtools typing
import React from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Project } from "../_data/project";

interface ProjectState {
  project: Project | null;
  projectId: string | null;
  selectProject: (project: Project) => void;
  selectProjectId: (projectId: string) => void;
}

const useProjectsStore = create<ProjectState>()(
  devtools(
    (set) => ({
      project: null,
      projectId: null,
      selectProject: (project) => set({ project }),
      selectProjectId: (projectId) => set({ projectId: projectId }),
    }),
    { name: "ProjectsStore" },
  ),
);

export function useSelectedProject() {
  const project = useProjectsStore((state) => state.project);
  const selectProjectInStore = useProjectsStore((state) => state.selectProject);
  const selectProjectId = useProjectsStore((state) => state.selectProjectId);

  React.useEffect(() => {
    const projectId = localStorage.getItem("selectedProjectId");
    if (projectId) {
      selectProjectId(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectProject(project: Project) {
    localStorage.setItem("selectedProjectId", project.id);
    selectProjectInStore(project);
    selectProjectId(project.id);
  }

  return { project, selectProject };
}
