"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Project } from "@/app/_data/project";
import { ProjectsContext } from "@/app/_state/project-state";

/** Route identity wins; a saved preference is only a fallback outside group routes. */
export function ProjectSelectionProvider({
  projects,
  userId,
  routeProjectId,
  children,
}: {
  projects: Project[];
  userId: string | null;
  routeProjectId?: string;
  children: ReactNode;
}) {
  const [preference, setPreference] = useState<{
    userId: string | null;
    id: string | null;
  } | null>(null);
  const hydrated = preference !== null && preference.userId === userId;
  useEffect(() => {
    let id: string | null = null;
    if (userId) {
      try {
        id =
          localStorage.getItem(`selectedProjectId:${userId}`) ??
          localStorage.getItem("selectedProjectId");
      } catch {
        /* Storage can be unavailable in private browsing. */
      }
    }
    setPreference({ userId, id });
  }, [userId]);

  const project = !userId
    ? null
    : routeProjectId
      ? (projects.find((project) => project.id === routeProjectId) ?? null)
      : hydrated
        ? (projects.find((project) => project.id === preference.id) ??
          projects[0] ??
          null)
        : null;

  const remember = useCallback(
    (id: string) => {
      if (!userId) return;
      try {
        localStorage.setItem(`selectedProjectId:${userId}`, id);
      } catch {
        /* Selection still works without persistence. */
      }
    },
    [userId],
  );
  useEffect(() => {
    if (hydrated && project) remember(project.id);
  }, [hydrated, project, remember]);

  const selectProject = useCallback(
    (selected: Project | undefined) => {
      const id = selected?.id ?? projects[0]?.id ?? null;
      setPreference({ userId, id });
      if (id) remember(id);
    },
    [projects, userId, remember],
  );
  const state = useMemo(
    () => ({
      projects: userId ? projects : [],
      project,
      selectProject,
      isAdmin:
        userId !== null && project !== null && userId === project.createdBy,
    }),
    [projects, project, selectProject, userId],
  );
  return <ProjectsContext value={state}>{children}</ProjectsContext>;
}
