"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { List } from "@/app/_data/list";
import LoadingPage from "@/components/ui/loading-page";
import { db, type OfflineList } from "@/lib/offline/db";
import { projectListsQueryKey } from "@/lib/queries/use-project-lists";
import CollapsibleCompletedSection from "./_components/collapsible-completed-section";
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

// Same sort as lists.tsx — most recently updated first (considers item updatedAt too)
function compareLists(a: List, b: List) {
  const updatedAtA = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
  const itemsUpdatedAtA = a.items.reduce(
    (acc, item) => Math.max(acc, item.updatedAt?.getTime() ?? 0),
    0,
  );
  const updatedAtB = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
  const itemsUpdatedAtB = b.items.reduce(
    (acc, item) => Math.max(acc, item.updatedAt?.getTime() ?? 0),
    0,
  );
  const diff =
    Math.max(updatedAtB, itemsUpdatedAtB) -
    Math.max(updatedAtA, itemsUpdatedAtA);
  return diff !== 0 ? diff : a.name.localeCompare(b.name);
}

export default function Loading() {
  const queryClient = useQueryClient();
  const tLists = useTranslations("lists");

  const [projectId] = useState(() =>
    typeof window !== "undefined" ? getProjectIdFromPath() : undefined,
  );

  const [lists, setLists] = useState<List[] | null>(() => {
    if (!projectId) return null;
    return (
      queryClient.getQueryData<List[]>(projectListsQueryKey(projectId)) ?? null
    );
  });

  // IndexedDB fallback when TQ cache is cold
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
  const completedLists = lists.filter(
    (list) =>
      list.items.length > 0 && list.items.every((item) => item.completed),
  );

  const favoriteLists = incompleteLists.filter((l) => l.favorite);
  const regularLists = incompleteLists.filter((l) => !l.favorite);

  favoriteLists.sort(compareLists);
  regularLists.sort(compareLists);
  completedLists.sort(compareLists);

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        {favoriteLists.length > 0 && (
          <div className="space-y-2">
            <h2 className="px-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              {tLists("favorites")}
            </h2>
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3">
              {favoriteLists.map((list) => (
                <ListPreview key={list.id} list={list} />
              ))}
            </div>
          </div>
        )}

        {regularLists.length > 0 && (
          <div className="space-y-2">
            {favoriteLists.length > 0 && (
              <h2 className="px-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                {tLists("others")}
              </h2>
            )}
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3">
              {regularLists.map((list) => (
                <ListPreview key={list.id} list={list} />
              ))}
            </div>
          </div>
        )}

        <CollapsibleCompletedSection lists={completedLists} />
      </div>
    </div>
  );
}
