"use client";

import type { Project } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";
import { useParams } from "next/navigation";
import React from "react";

export default function ProjectSelector({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (projectId: string) => void;
}) {
  const params = useParams<{ projectId: string }>();
  const { project, selectProject } = useSelectedProject();

  React.useEffect(() => {
    if (project === null && projects.length > 0) {
      if (params.projectId) {
        const projectToSelect = projects.find((p) => p.id === params.projectId);
        if (projectToSelect) {
          selectProject(projectToSelect);
        }
      } else {
        selectProject(projects[0]!);
      }
    }
  }, [params.projectId, project, projects, selectProject]);

  function handleOptionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const projectId = e.target.value;
    const projectToSelect = projects.find((p) => p.id === projectId);
    if (projectToSelect) {
      selectProject(projectToSelect);
    }
    onSelect(projectId);
  }

  return (
    <select
      value={project?.id ?? ""}
      onChange={handleOptionChange}
      className="select select-bordered w-full max-w-xs"
    >
      {projects.length > 0 ? (
        projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))
      ) : (
        <option value="" disabled>
          Seleccionar projecte
        </option>
      )}
    </select>
  );
}
