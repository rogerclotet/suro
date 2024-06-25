"use client";

import { useProjectsStore } from "@/app/_state/projects";
import { getProjects } from "@/server/projects";
import React from "react";

export default function ProjectSelector() {
  const state = useProjectsStore();

  React.useEffect(() => {
    async function fetchProjects() {
      const projects = await getProjects();

      if (projects.length > 0) {
        state.updateProjects(projects);
        state.selectProject(projects[0]!.id);
      }
    }
    fetchProjects().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOptionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "new") {
      // TODO create new project
      return;
    }

    state.selectProject(Number(e.target.value));
  }

  return (
    <select
      value={state.selectedProjectId}
      onChange={handleOptionChange}
      className="select select-bordered w-full max-w-xs"
    >
      {state.projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
      <option value="new">+ Nou projecte</option>
    </select>
  );
}
