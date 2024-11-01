"use client";

import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React from "react";
import { deleteListItem, updateListItem } from "./actions";
import CategoryItems from "./category-items";
import NewListItem from "./new-list-item";

export default function CheckList(props: { list: List }) {
  const [itemsByCategory, setItemsByCategory] = React.useState(
    groupItemsByCategory(props.list.items),
  );
  const { project } = useProjects();
  const [animationParent] = useAutoAnimate();

  React.useEffect(() => {
    setItemsByCategory(groupItemsByCategory(props.list.items));
  }, [props.list.items]);

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

    setItemsByCategory(groupItemsByCategory(props.list.items));

    await updateListItem(props.list, item.id, name, completed, categoryId);
  }

  async function handleDelete(item: List["items"][number]) {
    setItemsByCategory(
      groupItemsByCategory(props.list.items.filter((i) => i.id !== item.id)),
    );
    await deleteListItem(props.list, item.id);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const itemId = event.active.data.current?.id as string | undefined;
    if (!itemId) {
      return;
    }
    const categoryName = event.over?.data.current?.category as
      | string
      | undefined;
    if (!categoryName) {
      return;
    }

    const item = props.list.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    const category =
      project?.categories.find((c) => c.name === categoryName) ?? null;
    if (!category) {
      return;
    }

    item.category = category;
    setItemsByCategory(groupItemsByCategory(props.list.items));

    await updateListItem(
      props.list,
      itemId,
      item.name,
      item.completed ?? false,
      category.id,
    );
  }

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
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

function groupItemsByCategory(items: List["items"]) {
  const categories = new Map<string, List["items"]>();

  for (const item of items) {
    const category = item.category?.name ?? "";
    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category)!.push(item);
  }

  const result = [];
  for (const [category, items] of categories.entries()) {
    result.push({ category, items: sorted(items) });
  }

  result.sort((a, b) => a.category.localeCompare(b.category));

  return result;
}
