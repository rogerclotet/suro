"use client";

import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProjectSelector({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (projectId: string) => void;
}) {
  const { project, selectProject } = useProjects();

  function handleOptionChange(projectId: string) {
    const projectToSelect = projects.find((p) => p.id === projectId);
    if (projectToSelect) {
      selectProject(projectToSelect);
    }
    onSelect(projectId);
  }

  return (
    <Select value={project?.id ?? ""} onValueChange={handleOptionChange}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            projects.length > 0 && project
              ? project.name
              : "Seleccionar projecte"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
