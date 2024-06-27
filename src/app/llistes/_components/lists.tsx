"use client";

import type { Project } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";

export default function Lists({ projects }: { projects: Project[] }) {
  const { selectedProjectId } = useSelectedProject();

  return (
    <div>
      Llistes del projecte{" "}
      {projects.find((p) => p.id === selectedProjectId)?.name}
    </div>
  );
}
