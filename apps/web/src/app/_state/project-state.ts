"use client";

import type {} from "@redux-devtools/extension"; // required for devtools typing
import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { useSession } from "@/lib/session";
import type { Project } from "../_data/project";

interface ProjectState {
  projects: Project[];
  project: Project | null;
  projectId: string | null;
  setProjects: (projects: Project[]) => void;
  selectProject: (project: Project | undefined) => void;
  selectProjectId: (projectId: string) => void;
}

const useProjectsStore = create<ProjectState>()(
  devtools(
    (set) => ({
      projects: [],
      project: null,
      projectId: null,
      setProjects: (projects) => set({ projects }),
      selectProject: (project) => set({ project }),
      selectProjectId: (projectId) => set({ projectId: projectId }),
    }),
    { name: "ProjectsStore" },
  ),
);

export function useProjects() {
  const {
    setProjects,
    projects,
    project,
    selectProject: selectProjectInStore,
    projectId,
    selectProjectId,
  } = useProjectsStore(
    useShallow((state) => ({
      setProjects: state.setProjects,
      projects: state.projects,
      project: state.project,
      selectProject: state.selectProject,
      projectId: state.projectId,
      selectProjectId: state.selectProjectId,
    })),
  );

  const { data: session } = useSession();
  const isAdmin = useMemo(
    () => session?.user.id === project?.createdBy,
    [session, project],
  );

  useEffect(() => {
    const projectId = localStorage.getItem("selectedProjectId");
    if (projectId) {
      selectProjectId(projectId);
    }
  }, [selectProjectId]);

  useEffect(() => {
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

    if (projects[0]) {
      selectProjectInStore(projects[0]);
      selectProjectId(projects[0].id);
    }
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

  return {
    setProjects,
    projects,
    project,
    selectProject,
    isAdmin,
  };
}
