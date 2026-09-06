"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  adaptList,
  adaptListSummary,
  adaptTemplate,
  type List,
  type ListDetail,
  type ListSummary,
  type Template,
} from "@/app/_data/list";

/** Reactive lists for a project (Convex). `undefined` while loading. */
export function useProjectLists(
  projectId: string | undefined,
): List[] | undefined {
  const data = useQuery(
    api.lists.listByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );
  return data?.map((l) => adaptList(l));
}

export function useListSummaries(projectId: string): ListSummary[] | undefined {
  const data = useQuery(api.lists.summariesByProject, {
    projectId: projectId as Id<"projects">,
  });
  return data?.map(adaptListSummary);
}

/** A single reactive list with its items + linked event. `null` if it's gone. */
export function useList(listId: string): ListDetail | null | undefined {
  const data = useQuery(api.lists.get, { listId: listId as Id<"lists"> });
  if (data === undefined) {
    return undefined;
  }
  return data === null ? null : adaptList(data, data.event);
}

/** Reactive list templates for a project (Convex). */
export function useProjectTemplates(projectId: string): Template[] | undefined {
  const data = useQuery(api.templates.listByProject, {
    projectId: projectId as Id<"projects">,
  });
  return data?.map(adaptTemplate);
}
