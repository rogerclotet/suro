"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { List } from "@/app/_data/list";
import LoadingPage from "@/components/ui/loading-page";
import { db, type OfflineList } from "@/lib/offline/db";
import { projectListsQueryKey } from "@/lib/queries/use-project-lists";
import ListPreview from "./_components/list-preview";

function getProjectIdFromPath(): string | undefined {
  const segments = window.location.pathname.split("/").filter(Boolean);
  const i = segments.indexOf("groups");
  return i !== -1 ? segments[i + 1] : undefined;
}

function offlineToPreview(l: OfflineList): List {
  return {
    id: l.id,
    name: l.name,
    description: l.description,
    projectId: l.projectId,
    favorite: l.favorite,
    items: [],
    event: null,
    createdAt: new Date(l.createdAt),
    updatedAt: new Date(l.updatedAt),
  } as unknown as List;
}

export default function Loading() {
  const queryClient = useQueryClient();

  // Read projectId from URL. Safe for SSR: returns undefined on the server,
  // so both server and client render the spinner on initial load (no hydration mismatch).
  // On client-side navigation (no SSR), the TQ path runs synchronously.
  const [projectId] = useState(() =>
    typeof window !== "undefined" ? getProjectIdFromPath() : undefined,
  );

  const [lists, setLists] = useState<List[] | null>(() => {
    if (!projectId) return null;
    return (
      queryClient.getQueryData<List[]>(projectListsQueryKey(projectId)) ?? null
    );
  });

  // IndexedDB fallback when TQ cache is cold (e.g. first session load)
  useEffect(() => {
    if (lists !== null || !projectId) return;

    db.lists
      .where("projectId")
      .equals(projectId)
      .filter((l) => !l._deleted)
      .toArray()
      .then((offlineLists) => {
        if (offlineLists.length > 0) {
          setLists(offlineLists.map(offlineToPreview));
        }
      })
      .catch(() => {});
  }, [lists, projectId]);

  if (!lists || lists.length === 0) return <LoadingPage />;

  const incompleteLists = lists.filter(
    (list) =>
      list.items.length === 0 || list.items.some((item) => !item.completed),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3">
        {incompleteLists.map((list) => (
          <ListPreview key={list.id} list={list} />
        ))}
      </div>
    </div>
  );
}
