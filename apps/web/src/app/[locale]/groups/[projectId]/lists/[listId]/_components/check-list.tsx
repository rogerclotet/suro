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
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { List, ListItem } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import CategoryItems from "./category-items";
import NewListItem from "./list-item/new-list-item";

export default function CheckList(props: { list: List }) {
  const { project } = useProjects();
  const list = props.list;

  const [dragging, setDragging] = useState(false);
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const updateItem = useMutation(api.listItems.update);
  const removeItem = useMutation(api.listItems.remove);

  // Keep refs to latest values so stable callbacks can always read current state.
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
      try {
        await updateItem({
          itemId: item.id as Id<"listItems">,
          name,
          details,
          completed,
          categoryId: categoryId ? (categoryId as Id<"categories">) : null,
        });
      } catch (e) {
        toast.error("No s'ha pogut actualitzar l'element");
        throw e;
      }
    },
    [updateItem],
  );

  const handleDelete = useCallback(
    async (item: List["items"][number]) => {
      await removeItem({ itemId: item.id as Id<"listItems"> });
    },
    [removeItem],
  );

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

    if ((category?.id ?? null) === (item.categoryId ?? null)) {
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

    await updateItem({
      itemId: item.id as Id<"listItems">,
      name: item.name,
      details: item.details ?? "",
      completed: item.completed ?? false,
      categoryId: category?.id ? (category.id as Id<"categories">) : null,
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
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
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
