"use client";

import { useProjectsStore } from "@/app/_state/projects";
import { getProjects } from "@/server/projects";
import React from "react";
import CreateProject from "./create-project/create-project";

export default function ProjectSelector() {
  const state = useProjectsStore();
  const [creatingProject, setCreatingProject] = React.useState(false);

  React.useEffect(() => {
    async function fetchProjects() {
      const projects = await getProjects();

      if (projects.length > 0) {
        state.setProjects(projects);
        state.selectProject(projects[0]!.id);
      }
    }
    fetchProjects().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOptionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "new") {
      setCreatingProject(true);
      return;
    }

    setCreatingProject(false);
    state.selectProject(Number(e.target.value));
  }

  return (
    <>
      <li>
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
      </li>
      {creatingProject && (
        <CreateProject onClose={() => setCreatingProject(false)} />
      )}
    </>
  );
}
