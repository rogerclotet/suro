"use client";

import { useQuery } from "@tanstack/react-query";
import type { List } from "@/app/_data/list";

export function projectListsQueryKey(projectId: string) {
  return ["lists", projectId] as const;
}

export function useProjectLists(projectId: string, initialData?: List[]) {
  return useQuery({
    queryKey: projectListsQueryKey(projectId),
    queryFn: async (): Promise<List[]> => {
      const response = await fetch(`/api/${projectId}/lists`);
      if (!response.ok) throw new Error("Failed to fetch lists");
      return response.json();
    },
    initialData,
    // Mark server-provided initial data as fresh so TQ doesn't immediately refetch.
    // After staleTime expires, it refetches transparently in the background.
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 2 * 60_000,
  });
}
