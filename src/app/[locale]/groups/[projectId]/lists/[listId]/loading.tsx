"use client";

import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/loading-page";
import { db, type OfflineList, type OfflineListItem } from "@/lib/offline/db";

type State = "checking" | "found" | "not-found";

interface OfflineData {
  list: OfflineList;
  items: OfflineListItem[];
}

export default function Loading() {
  const [state, setState] = useState<State>("checking");
  const [data, setData] = useState<OfflineData | null>(null);

  useEffect(() => {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const listId = segments.at(-1);
    if (!listId) {
      setState("not-found");
      return;
    }

    Promise.all([
      db.lists.get(listId),
      db.listItems.where("listId").equals(listId).toArray(),
    ])
      .then(([list, items]) => {
        if (list && items.length > 0) {
          setData({ list, items });
          setState("found");
        } else {
          setState("not-found");
        }
      })
      .catch(() => setState("not-found"));
  }, []);

  if (state !== "found" || !data) {
    return <LoadingPage />;
  }

  return <OfflineListPreview data={data} />;
}

function OfflineListPreview({ data }: { data: OfflineData }) {
  const { list, items } = data;

  const visibleItems = items
    .filter((i) => !i._deleted)
    .sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.name.localeCompare(b.name);
    });

  const doneCount = visibleItems.filter((i) => i.completed).length;
  const totalCount = visibleItems.length;

  // Group by category name
  const byCategory = new Map<string, OfflineListItem[]>();
  for (const item of visibleItems) {
    const cat = item.categoryName ?? "";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)?.push(item);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-semibold text-xl">{list.name}</h1>
      </div>

      <div className="mx-auto max-w-lg">
        {totalCount > 0 && (
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-sm bg-muted">
              <div
                className="h-full rounded-sm bg-primary"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {doneCount}/{totalCount}
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-lg flex-col items-stretch gap-4">
        {[...byCategory.entries()].map(([category, catItems]) => (
          <div key={category || "__none__"}>
            {category && (
              <p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">
                {category}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {catItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5"
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded-sm border border-primary ${item.completed ? "bg-primary" : ""}`}
                  />
                  <span
                    className={
                      item.completed
                        ? "text-muted-foreground line-through"
                        : undefined
                    }
                  >
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
