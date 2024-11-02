"use client";

import type { List } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import React from "react";
import { toast } from "sonner";
import { deleteListItem, updateListItem } from "./actions";
import CategoryItems from "./category-items";
import NewListItem from "./new-list-item";

export default function CheckList(props: { list: List }) {
  const { project } = useProjects();
  const [itemsByCategory, setItemsByCategory] = React.useState(
    groupItemsByCategory(props.list.items, project),
  );
  const [dragging, setDragging] = React.useState(false);
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  React.useEffect(() => {
    setItemsByCategory(groupItemsByCategory(props.list.items, project));
  }, [props.list.items, project]);

  async function handleChange(
    item: List["items"][number],
    name: string,
    completed: boolean,
    categoryId: string | null,
  ) {
    if (name === "") {
      return;
    }

    item.name = name;
    item.completed = completed;
    item.category =
      project?.categories.find((c) => c.id === categoryId) ?? null;
    item.updatedAt = new Date();

    setItemsByCategory(groupItemsByCategory(props.list.items, project));

    await updateListItem(props.list, item.id, name, completed, categoryId);
  }

  async function handleDelete(item: List["items"][number]) {
    setItemsByCategory(
      groupItemsByCategory(
        props.list.items.filter((i) => i.id !== item.id),
        project,
      ),
    );
    await deleteListItem(props.list, item.id);
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

    const item = props.list.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    const category =
      project?.categories.find((c) => c.name === categoryName) ?? null;

      if (
        props.list.items.find(
          (i) =>
            i.categoryId === (category?.id ?? null) && i.name === item.name,
        )
      ) {
        toast.error("L'element ja existeix a aquesta categoria");
        return;
      }

    item.category = category;
    setItemsByCategory(groupItemsByCategory(props.list.items, project));

    await updateListItem(
      props.list,
      itemId,
      item.name,
      item.completed ?? false,
      category?.id ?? null,
    );
  }

  return (
    <DndContext
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full">
        <div className="mx-auto max-w-lg">
          <NewListItem list={props.list} />
        </div>

        <div className="mx-auto flex max-w-lg flex-col items-stretch gap-1">
          {itemsByCategory.map(({ category, items }) => (
            <CategoryItems
              key={category}
              category={category}
              items={items}
              list={props.list}
              isDragging={dragging}
              handleChange={handleChange}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function sorted(items: List["items"]) {
  return [...items].sort(compareItems);
}

function compareItems(a: List["items"][number], b: List["items"][number]) {
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

  const categories = project.categories.reduce((acc, category) => {
    acc.set(category.name, []);
    return acc;
  }, new Map<string, List["items"]>());
  categories.set("", []);

  for (const item of items) {
    const category = item.category?.name ?? "";
    categories.get(category)!.push(item);
  }

  const result = [];
  for (const [category, items] of categories.entries()) {
    result.push({ category, items: sorted(items) });
  }

  result.sort((a, b) => a.category.localeCompare(b.category));

  return result;
}
