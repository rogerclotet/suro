import type {} from "@redux-devtools/extension"; // required for devtools typing
import React from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ProjectState {
  selectedProjectId: string | null;
  selectProject: (projectId: string) => void;
}

const useProjectsStore = create<ProjectState>()(
  devtools(
    (set) => ({
      selectedProjectId: null,
      selectProject: (projectId) => set({ selectedProjectId: projectId }),
    }),
    { name: "ProjectsStore" },
  ),
);

export function useSelectedProject() {
  const selectedProjectId = useProjectsStore(
    (state) => state.selectedProjectId,
  );
  const selectProjectInState = useProjectsStore((state) => state.selectProject);

  React.useEffect(() => {
    const projectId = localStorage.getItem("selectedProjectId");
    if (projectId) {
      selectProjectInState(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectProject(projectId: string) {
    localStorage.setItem("selectedProjectId", projectId);
    selectProjectInState(projectId);
  }

  return { selectedProjectId, selectProject };
}
