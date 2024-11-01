"use client";

import type { List } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React from "react";
import { deleteListItem, updateListItem } from "./actions";
import CategoryItems from "./category-items";
import NewListItem from "./new-list-item";

export default function CheckList(props: { list: List }) {
  const { project } = useProjects();
  const [itemsByCategory, setItemsByCategory] = React.useState(
    groupItemsByCategory(props.list.items, project),
  );
  const [animationParent] = useAutoAnimate();
  const [dragging, setDragging] = React.useState(false);

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
    >
      <div className="w-full">
        <ul
          ref={animationParent}
          className="mx-auto flex max-w-lg flex-col items-stretch gap-1"
        >
          <NewListItem list={props.list} />

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
        </ul>
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
