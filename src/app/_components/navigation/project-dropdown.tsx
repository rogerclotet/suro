"use client";

import type { Project } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";
import React from "react";

export default function ProjectSelector({ projects }: { projects: Project[] }) {
  const { selectedProjectId, selectProject } = useSelectedProject();

  function handleOptionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    selectProject(e.target.value);
  }

  return (
    <select
      value={selectedProjectId}
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
