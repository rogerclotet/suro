"use client";

import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";
import type { Project } from "../_data/project";
import { useProjects } from "../_state/project-state";

export default function Redirect({ project }: { project?: Project }) {
  const { projects, project: selectedProject, selectProject } = useProjects();

  React.useEffect(() => {
    if (project) {
      selectProject(project);
    } else if (!selectedProject) {
      selectProject(projects[0]!);
    }
  }, [project, projects, selectedProject, selectProject]);

  if (projects.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return redirect(`/projectes/${project?.id ?? selectedProject?.id}/llistes`);
}
