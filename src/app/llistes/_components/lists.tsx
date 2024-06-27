"use client";

import { useProjectsStore } from "@/app/_state/projects";

export default function Lists() {
  const projects = useProjectsStore((state) => state.projects);
  const selectedProjectId = useProjectsStore(
    (state) => state.selectedProjectId,
  );

  return (
    <div>
      Listes del projecte{" "}
      {projects.find((p) => p.id === selectedProjectId)?.name}
    </div>
  );
}
