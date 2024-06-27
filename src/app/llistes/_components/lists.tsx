"use client";

import { useProjectsStore } from "@/app/_state/projects";

export default function Lists() {
  const projects = useProjectsStore((state) => state.projects);
  const selectedProjectId = useProjectsStore(
    (state) => state.selectedProjectId,
  );
  const isLoading = useProjectsStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array<undefined>(3)].map((_, i) => (
          <div key={i} className="skeleton h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      Llistes del projecte{" "}
      {projects.find((p) => p.id === selectedProjectId)?.name}
    </div>
  );
}
