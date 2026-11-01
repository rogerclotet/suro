"use client";

import { useCallback } from "react";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { usePathname, useRouter } from "@/i18n/navigation";
import { resolveSectionForProject } from "./use-menu-items";

/** The section segment of a group route, from its canonical pathname. */
export function currentSection(pathname: string): string | undefined {
  return pathname.split("/groups/[projectId]/")[1]?.split("/")[0];
}

/**
 * Opens another group in the section the user is in, so switching from Lists
 * lands on the other group's Lists. Detail pages fall back to their section.
 */
export function useSwitchGroup() {
  const { selectProject } = useProjects();
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (project: Project) => {
      selectProject(project);
      const section = resolveSectionForProject(
        project,
        currentSection(pathname),
      );
      router.push(`/groups/${project.id}/${section}` as never);
    },
    [pathname, router, selectProject],
  );
}
