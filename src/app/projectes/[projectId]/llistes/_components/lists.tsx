"use client";

import type { Project } from "@/app/_data/project";

export default function Lists({ project }: { project: Project }) {
  return <div>Llistes del projecte {project.name}</div>;
}
