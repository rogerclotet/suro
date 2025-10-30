"use client";

import React from "react";
import { useProjects } from "@/app/_state/project-state";

export default function CurrentProjectUpdater({
  projectId,
}: {
  projectId: string;
}) {
  const { projects, project, selectProject } = useProjects();

  React.useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    if (projectId !== project?.id) {
      const projectToSelect = projects.find((p) => p.id === projectId);
      if (projectToSelect) {
        selectProject(projectToSelect);
      }
    }
  }, [projectId, project, projects, selectProject]);

  return null;
}
