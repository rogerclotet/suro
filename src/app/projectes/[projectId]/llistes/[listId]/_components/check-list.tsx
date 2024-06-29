"use client";

import type { List } from "@/app/_data/list";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React from "react";
import { deleteListItem, updateListItem } from "./actions";
import ListItem from "./list-item";
import NewListItem from "./new-list-item";

export default function CheckList(props: { list: List }) {
  const [items, setItems] = React.useState(props.list.items);
  const [animationParent] = useAutoAnimate();

  React.useEffect(() => {
    setItems(props.list.items);
  }, [props.list.items]);

  async function handleChange(
    itemId: string,
    name: string,
    completed: boolean,
  ) {
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    item.name = name;
    item.completed = completed;
    item.updatedAt = new Date();
    setItems(sorted(items));

    await updateListItem(props.list, itemId, name, completed);
  }

  async function handleDelete(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    setItems(items.filter((i) => i.id !== itemId));
    await deleteListItem(props.list, itemId);
  }

  return (
    <div className="w-full">
      <ul
        ref={animationParent}
        className="mx-auto flex flex-col items-stretch gap-1 lg:max-w-lg"
      >
        <NewListItem list={props.list} />

        {items.map((item) => (
          <ListItem
            key={item.id}
            id={item.id}
            name={item.name}
            completed={item.completed ?? false}
            onChange={(name, completed) =>
              handleChange(item.id, name, completed)
            }
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </ul>
    </div>
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

  const dateA = a.updatedAt ?? a.createdAt!;
  const dateB = b.updatedAt ?? b.createdAt!;

  return dateA < dateB ? 1 : -1;
}
