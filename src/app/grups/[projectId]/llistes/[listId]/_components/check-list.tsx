"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { List, ListItem } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import {
  deleteListItemOffline,
  updateListItemOffline,
} from "@/lib/offline/offline-actions";
import { useOfflineList } from "@/lib/offline/use-offline-list";
import CategoryItems from "./category-items";
import NewListItem from "./list-item/new-list-item";

export default function CheckList(props: { list: List }) {
  const { project } = useProjects();

  const [dragging, setDragging] = useState(false);
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  // Use offline-first data
  const { list: offlineList } = useOfflineList(props.list, props.list.id);

  // Track optimistic updates: itemId -> updated item data
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<string, Partial<ListItem>>
  >(new Map());

  // Use offline list as base, with optimistic overlay
  const baseList = offlineList ?? props.list;

  const list = useMemo(() => {
    if (optimisticUpdates.size === 0) {
      return baseList;
    }
    return {
      ...baseList,
      items: baseList.items.map((item) => {
        const update = optimisticUpdates.get(item.id);
        return update ? { ...item, ...update } : item;
      }),
    };
  }, [baseList, optimisticUpdates]);

  // Keep refs to latest values so stable callbacks can always read current state
  const listRef = useRef(list);
  const projectRef = useRef(project);
  // eslint-disable-next-line react-hooks/refs
  listRef.current = list;
  // eslint-disable-next-line react-hooks/refs
  projectRef.current = project;

  const itemsByCategory = useMemo(
    () => groupItemsByCategory(list.items, project),
    [list.items, project],
  );

  const handleChange = useCallback(
    async (
      item: List["items"][number],
      name: string,
      details: string,
      completed: boolean,
      categoryId: string | null,
    ) => {
      if (name === "") {
        return;
      }

      const category = projectRef.current?.categories.find(
        (c) => c.id === categoryId,
      );

      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(item.id, { name, details, completed, categoryId, category });
        return next;
      });

      try {
        await updateListItemOffline(
          listRef.current,
          item.id,
          name,
          details,
          completed,
          categoryId,
          category?.name,
        );
      } catch (e) {
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(item.id);
          return next;
        });
        throw e;
      }
    },
    [],
  );

  const handleDelete = useCallback(async (item: List["items"][number]) => {
    await deleteListItemOffline(listRef.current, item.id);
  }, []);

  function handleDragStart(_event: DragStartEvent) {
    setDragging(true);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDragging(false);

    const itemId = event.active.data.current?.id as string | undefined;
    if (!itemId) {
      return;
    }
    const categoryName = event.over?.data.current?.category as
      | string
      | undefined;
    if (categoryName === undefined) {
      return;
    }

    const currentList = listRef.current;
    const item = currentList.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    const category =
      projectRef.current?.categories.find((c) => c.name === categoryName) ??
      null;

    if (category === item.category) {
      return;
    }

    if (
      currentList.items.find(
        (i) => i.categoryId === (category?.id ?? null) && i.name === item.name,
      )
    ) {
      toast.error("L'element ja existeix a aquesta categoria");
      return;
    }

    // Apply optimistic update for category change
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      const currentUpdate = next.get(itemId) ?? {};
      next.set(itemId, {
        ...currentUpdate,
        category,
        categoryId: category?.id ?? null,
      });
      return next;
    });

    await updateListItemOffline(
      currentList,
      itemId,
      item.name,
      item.details ?? "",
      item.completed ?? false,
      category?.id ?? null,
      category?.name,
    );

    // Clear optimistic update after successful API call
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }

  const doneCount = list.items.filter((i) => i.completed).length;
  const totalCount = list.items.length;

  return (
    <DndContext
      id="list-dnd"
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="mx-auto max-w-lg">
        {totalCount > 0 && (
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-sm bg-muted">
              <div
                className="h-full rounded-sm bg-primary transition-[width] duration-300 ease-in-out"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
              {doneCount}/{totalCount}
            </span>
          </div>
        )}
        <NewListItem list={list} />
      </div>

      <div className="mx-auto flex max-w-lg flex-col items-stretch gap-4">
        {itemsByCategory.map(({ category, items }) => (
          <CategoryItems
            key={`category-${category === "" ? "<none>" : category}`}
            category={category}
            items={items}
            list={list}
            isDragging={dragging}
            handleChange={handleChange}
            handleDelete={handleDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}

function compareItems(a: ListItem, b: ListItem) {
  if (a.completed && !b.completed) return 1;
  if (!a.completed && b.completed) return -1;
  const nameCompare = a.name.localeCompare(b.name);
  return nameCompare !== 0 ? nameCompare : a.id.localeCompare(b.id);
}

function groupItemsByCategory(items: List["items"], project: Project | null) {
  // Build categories from project if available, otherwise extract from items
  const categoryNames = new Set<string>([""]);

  if (project) {
    for (const category of project.categories) {
      categoryNames.add(category.name);
    }
  }

  // Also include any categories found in items (for offline support)
  for (const item of items) {
    if (item.category?.name) {
      categoryNames.add(item.category.name);
    }
  }

  const categories = new Map<string, List["items"]>();
  for (const name of categoryNames) {
    categories.set(name, []);
  }

  for (const item of items) {
    const category = item.category?.name ?? "";
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)?.push(item);
  }

  const result = [];
  for (const [category, categoryItems] of categories.entries()) {
    categoryItems.sort(compareItems);
    result.push({ category, items: categoryItems });
  }

  result.sort((a, b) => {
    if (a.items.length !== 0 && b.items.length !== 0) {
      return a.category.localeCompare(b.category);
    }
    return b.items.length - a.items.length;
  });

  return result;
}
