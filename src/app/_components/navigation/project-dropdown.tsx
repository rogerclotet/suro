"use client";

import { useProjectsStore } from "@/app/_state/projects";
import { getProjects } from "@/server/projects";
import React from "react";

export default function ProjectSelector() {
  const state = useProjectsStore();

  React.useEffect(() => {
    async function fetchProjects() {
      state.setIsLoading(true);
      const projects = await getProjects();

      if (projects.length > 0) {
        state.setProjects(projects);
        state.selectProject(projects[0]!.id);
      }

      state.setIsLoading(false);
    }
    fetchProjects().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOptionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    state.selectProject(Number(e.target.value));
  }

  return (
    <>
      <li>
        <select
          value={state.selectedProjectId !== -1 ? state.selectedProjectId : ""}
          onChange={handleOptionChange}
          className="select select-bordered w-full max-w-xs"
        >
          {state.projects.length > 0 ? (
            state.projects.map((project) => (
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
      </li>
    </>
  );
}
