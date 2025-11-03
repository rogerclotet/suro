"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import LoadingPage from "@/components/ui/loading-page";
import type { Project } from "../_data/project";
import { useProjects } from "../_state/project-state";

export default function Redirect({ project }: { project?: Project }) {
  const { projects, project: selectedProject, selectProject } = useProjects();

  useEffect(() => {
    if (project) {
      selectProject(project);
    } else if (!selectedProject && projects && projects.length > 0) {
      selectProject(undefined);
    }
  }, [project, projects, selectedProject, selectProject]);

  const projectId = project?.id ?? selectedProject?.id;

  if (!projectId || projects.length === 0) {
    return <LoadingPage />;
  }

  return redirect(`/grups/${projectId}/llistes`);
}
