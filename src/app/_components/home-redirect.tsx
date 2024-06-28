"use client";

import { redirect } from "next/navigation";
import { useSelectedProject } from "../_state/project-state";

export default function Redirect({ projectId }: { projectId?: string }) {
  const { selectedProjectId, selectProject } = useSelectedProject();

  if (projectId) {
    selectProject(projectId);
  } else if (!selectedProjectId) {
    return (
      <div className="flex h-[200px] justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  return redirect(`/projectes/${projectId ?? selectedProjectId}/llistes`);
}
