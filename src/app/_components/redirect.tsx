"use client";

import { useEffect } from "react";
import LoadingPage from "@/components/ui/loading-page";
import { useRouter } from "@/i18n/navigation";
import type { Project } from "../_data/project";
import { useProjects } from "../_state/project-state";

export default function Redirect({ project }: { project?: Project }) {
  const { projects, project: selectedProject, selectProject } = useProjects();
  const router = useRouter();

  useEffect(() => {
    if (project) {
      selectProject(project);
    } else if (!selectedProject && projects && projects.length > 0) {
      selectProject(undefined);
    }
  }, [project, projects, selectedProject, selectProject]);

  const projectId = project?.id ?? selectedProject?.id;

  useEffect(() => {
    if (projectId && projects.length > 0) {
      router.push({
        pathname: "/groups/[projectId]/lists",
        params: { projectId },
      });
    }
  }, [projectId, projects.length, router]);

  return <LoadingPage />;
}
