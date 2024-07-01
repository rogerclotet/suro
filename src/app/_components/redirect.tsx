"use client";

import { redirect } from "next/navigation";
import type { Project } from "../_data/project";
import { useSelectedProject } from "../_state/project-state";

export default function Redirect({ project }: { project?: Project }) {
  const { project: selectedProject, selectProject } = useSelectedProject();

  if (project) {
    selectProject(project);
  } else if (!selectedProject) {
    return (
      <div className="flex h-[200px] justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  return redirect(`/projectes/${project?.id ?? selectedProject?.id}/llistes`);
}
