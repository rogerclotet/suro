"use client";

import type { Project } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";
import React from "react";

export default function ProjectSelector({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (projectId: string) => void;
}) {
  const { selectedProjectId, selectProject } = useSelectedProject();

  React.useEffect(() => {
    if (selectedProjectId === null && projects.length > 0) {
      selectProject(projects[0]!.id);
    }
  }, [selectedProjectId, projects, selectProject]);

  function handleOptionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const projectId = e.target.value;
    selectProject(e.target.value);
    onSelect(projectId);
  }

  return (
    <select
      value={selectedProjectId ?? ""}
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
