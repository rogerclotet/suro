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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { List, ListItem } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import CategoryItems from "./category-items";
import { deleteListItem, updateListItem } from "./list-item/actions";
import NewListItem from "./list-item/new-list-item";

export default function CheckList(props: { list: List }) {
  const { project } = useProjects();

  const [dragging, setDragging] = useState(false);
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  // Track optimistic updates: itemId -> updated item data
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<string, Partial<ListItem>>
  >(new Map());

  const list = useMemo(() => {
    if (optimisticUpdates.size === 0) {
      return props.list;
    }
    return {
      ...props.list,
      items: props.list.items.map((item) => {
        const update = optimisticUpdates.get(item.id);
        return update ? { ...item, ...update } : item;
      }),
    };
  }, [props.list, optimisticUpdates]);

  const itemsByCategory = useMemo(
    () => groupItemsByCategory(list.items, project),
    [list.items, project],
  );

  async function handleChange(
    item: List["items"][number],
    name: string,
    details: string,
    completed: boolean,
    categoryId: string | null,
  ) {
    if (name === "") {
      return;
    }

    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      next.set(item.id, { name, details, completed, categoryId });
      return next;
    });

    try {
      await updateListItem(list, item.id, name, details, completed, categoryId);
    } catch (e) {
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
      throw e;
    }
  }

  async function handleDelete(item: List["items"][number]) {
    await deleteListItem(list, item.id);
  }

  async function handleDragStart(_event: DragStartEvent) {
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

    const item = list.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    const category =
      project?.categories.find((c) => c.name === categoryName) ?? null;

    if (category === item.category) {
      return;
    }

    if (
      list.items.find(
        (i) => i.categoryId === (category?.id ?? null) && i.name === item.name,
      )
    ) {
      toast.error("L'element ja existeix a aquesta categoria");
      return;
    }

    // Apply optimistic update for category change
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      const currentUpdate = next.get(itemId) || {};
      next.set(itemId, {
        ...currentUpdate,
        category,
        categoryId: category?.id ?? null,
      });
      return next;
    });

    await updateListItem(
      list,
      itemId,
      item.name,
      item.details ?? "",
      item.completed ?? false,
      category?.id ?? null,
    );

    // Clear optimistic update after successful API call
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }

  return (
    <DndContext
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="mx-auto max-w-lg">
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
  if (a.completed && !b.completed) {
    return 1;
  }

  if (!a.completed && b.completed) {
    return -1;
  }

  return a.name.localeCompare(b.name);
}

function groupItemsByCategory(items: List["items"], project: Project | null) {
  if (!project) {
    return [];
  }

  const categories = project.categories.reduce(
    (acc, category) => {
      acc.set(category.name, []);
      return acc;
    },
    new Map<string, List["items"]>([["", []]]),
  );

  for (const item of items) {
    const category = item.category?.name ?? "";
    categories.get(category)?.push(item);
  }

  const result = [];
  for (const [category, items] of categories.entries()) {
    items.sort(compareItems);
    result.push({ category, items });
  }

  result.sort((a, b) => {
    if (a.items.length !== 0 && b.items.length !== 0) {
      return a.category.localeCompare(b.category);
    }
    return b.items.length - a.items.length;
  });

  return result;
}
