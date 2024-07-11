"use client";

import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function ProjectSelector({
  onSelect,
}: {
  onSelect: (projectId: string) => void;
}) {
  const { projects, project, selectProject } = useProjects();

  function handleProjectSelect(projectId: string) {
    const projectToSelect = projects.find((p) => p.id === projectId);
    if (projectToSelect) {
      selectProject(projectToSelect);
    }
    onSelect(projectId);
  }

  return (
    <Collapsible className="space-y-2 rounded-lg border">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between"
        >
          {project?.name ?? "Seleccionar projecte"}
          <ChevronDown className="h-4 w-4" />
          <span className="sr-only">Seleccionar projecte</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2">
        {project &&
          projects
            .filter((p) => p.id !== project.id)
            .map((p) => (
              <Button
                key={p.id}
                onClick={() => handleProjectSelect(p.id)}
                variant="ghost"
                className="w-full justify-start"
              >
                {p.name}
              </Button>
            ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
