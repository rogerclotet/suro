"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CalendarFold, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import type { List } from "@/app/_data/list";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingPage from "@/components/ui/loading-page";
import { db } from "@/lib/offline/db";
import { projectListsQueryKey } from "@/lib/queries/use-project-lists";
import { cn, textToHtml } from "@/lib/utils";
import TimeRange from "../../calendar/_components/event/time-range";

function getUrlIds(): { listId: string | null; projectId: string | null } {
  if (typeof window === "undefined") return { listId: null, projectId: null };
  const segments = window.location.pathname.split("/").filter(Boolean);
  const groupsIdx = segments.indexOf("groups");
  if (groupsIdx === -1) return { listId: null, projectId: null };
  const projectId = segments[groupsIdx + 1] ?? null;
  const listId = segments.at(-1) ?? null;
  return { listId, projectId };
}

function groupByCategory(items: ListItem[]) {
  const byCategory = new Map<string, ListItem[]>();
  for (const item of items) {
    const cat = item.category ?? "";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)?.push(item);
  }
  const result = [...byCategory.entries()].map(([category, catItems]) => ({
    category,
    items: catItems.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.name.localeCompare(b.name);
    }),
  }));
  result.sort((a, b) => {
    if (a.items.length !== 0 && b.items.length !== 0)
      return a.category.localeCompare(b.category);
    return b.items.length - a.items.length;
  });
  return result;
}

interface ListItem {
  id: string;
  name: string;
  completed: boolean;
  category: string;
}

type State = "checking" | "found" | "not-found";

type PreviewData =
  | { source: "tq"; list: List; lists: List[] }
  | { source: "idb"; name: string; items: ListItem[] };

export default function Loading() {
  const queryClient = useQueryClient();

  const [state, setState] = useState<State>(() => {
    const { listId, projectId } = getUrlIds();
    if (!listId || !projectId) return "checking";
    const lists = queryClient.getQueryData<List[]>(
      projectListsQueryKey(projectId),
    );
    return lists?.some((l) => l.id === listId) ? "found" : "checking";
  });

  const [data, setData] = useState<PreviewData | null>(() => {
    const { listId, projectId } = getUrlIds();
    if (!listId || !projectId) return null;
    const lists = queryClient.getQueryData<List[]>(
      projectListsQueryKey(projectId),
    );
    const list = lists?.find((l) => l.id === listId);
    if (!list || !lists) return null;
    return { source: "tq", list, lists };
  });

  // IDB fallback when TQ cache is cold
  useEffect(() => {
    if (state === "found") return;
    const { listId } = getUrlIds();
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
          const visibleItems: ListItem[] = items
            .filter((i) => !i._deleted)
            .map((i) => ({
              id: i.id,
              name: i.name,
              completed: i.completed ?? false,
              category: i.categoryName ?? "",
            }));
          setData({ source: "idb", name: list.name, items: visibleItems });
          setState("found");
        } else {
          setState("not-found");
        }
      })
      .catch(() => setState("not-found"));
  }, [state]);

  if (state !== "found" || !data) return <LoadingPage />;

  if (data.source === "tq") {
    return <TQListPreview data={data} />;
  }

  return <IDBListPreview name={data.name} items={data.items} />;
}

// Pixel-accurate preview using TQ cache — matches ListsClientContainer + CheckList exactly.
// ClientOnly wraps ShareButton so it is absent on the first real render too; we only show
// the SettingsMenu placeholder to keep the button count consistent.
function TQListPreview({
  data,
}: {
  data: Extract<PreviewData, { source: "tq" }>;
}) {
  const { list, lists } = data;
  const items = list.items.map((item) => ({
    id: item.id,
    name: item.name,
    completed: item.completed ?? false,
    category: item.category?.name ?? "",
  }));

  return (
    <div className="space-y-6">
      {/* Header — matches ListsClientContainer h1 + ListsDropdown SelectTrigger */}
      <div className="flex items-center justify-between gap-4">
        <h1>
          <div className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 font-semibold text-xl">
            <span>{list.name}</span>
            <span className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </h1>
        {/* Only SettingsMenu — ShareButton is hidden by ClientOnly on first render */}
        <div className="size-9 rounded-md" />
      </div>

      {/* Event info — matches ListsClientContainer's event section */}
      {list.event && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2">
            <CalendarFold />
            <span>{list.event.name}</span>
          </h2>
          <TimeRange
            startAt={list.event.startAt}
            endAt={list.event.endAt}
            allDay={list.event.allDay}
            className="mt-0.5 text-muted-foreground text-sm"
          />
        </div>
      )}

      {/* Description */}
      {list.description && (
        <p
          // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized same as ListsClientContainer
          dangerouslySetInnerHTML={{ __html: textToHtml(list.description) }}
        />
      )}

      <ListBodyPreview items={items} listsCount={lists.length} />
    </div>
  );
}

function IDBListPreview({ name, items }: { name: string; items: ListItem[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1>
          <div className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 font-semibold text-xl">
            <span>{name}</span>
            <span className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </h1>
        <div className="size-9 rounded-md" />
      </div>

      <ListBodyPreview items={items} listsCount={1} />
    </div>
  );
}

function ListBodyPreview({
  items,
  listsCount,
}: {
  items: ListItem[];
  listsCount: number;
}) {
  const doneCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const grouped = groupByCategory(items);

  return (
    <>
      {/* Progress bar + NewListItem — matches CheckList's mx-auto max-w-lg block */}
      <div className="mx-auto max-w-lg">
        {totalCount > 0 && (
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-sm bg-muted">
              <div
                className="h-full rounded-sm bg-primary transition-[width] duration-300 ease-in-out"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {doneCount}/{totalCount}
            </span>
          </div>
        )}
        {/* Matches NewListItem's responsive layout: stacked on mobile, row on sm+ */}
        {listsCount > 0 && (
          <li className="flex w-full items-center justify-between gap-4">
            <div className="flex grow flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex grow items-start gap-2">
                <div className="h-10 grow rounded-md border border-input bg-background" />
              </div>
              <div className="h-10 w-full rounded-md border border-input bg-background sm:w-40" />
            </div>
          </li>
        )}
      </div>

      {/* Category groups — matches CheckList's items section */}
      <div className="mx-auto flex max-w-lg flex-col items-stretch gap-4">
        {grouped.map(({ category, items: catItems }) => (
          <div key={category || "__none__"} className="rounded-md">
            <h3 className="px-2 font-semibold text-lg">{category}</h3>
            <ul>
              {catItems.map((item) => (
                <li
                  key={item.id}
                  className="z-0 flex cursor-pointer touch-manipulation flex-row items-start gap-5 rounded-lg p-2 hover:bg-muted"
                >
                  <div className="flex flex-row items-center">
                    <Checkbox
                      checked={item.completed}
                      className="h-6 w-6 transition-all"
                      onCheckedChange={() => {}}
                    />
                  </div>
                  <span
                    className={cn(
                      "wrap-break-word grow overflow-hidden text-left",
                      item.completed
                        ? "text-muted-foreground line-through"
                        : "",
                    )}
                  >
                    {item.name}
                  </span>
                  <GripVertical className="text-muted-foreground" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
