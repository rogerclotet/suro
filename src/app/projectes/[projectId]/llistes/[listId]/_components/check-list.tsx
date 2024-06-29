"use client";

import type { List } from "@/app/_data/list";
import React from "react";
import { updateListItem } from "./actions";
import ListItem from "./list-item";
import NewListItem from "./new-list-item";

export default function CheckList(props: { list: List }) {
  const [items, setItems] = React.useState(props.list.items);

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

  function handleCreated(name: string) {
    const newItem: List["items"][number] = {
      id: "",
      name,
      details: null,
      completed: false,
      createdAt: new Date(),
      createdBy: "",
      updatedAt: null,
      updatedBy: "",
      listId: props.list.id,
    };

    setItems(sorted([...items, newItem]));
  }

  return (
    <ul className="flex flex-col items-stretch gap-1 pt-6 lg:items-center">
      <NewListItem list={props.list} onCreated={handleCreated} />

      {items.map((item) => (
        <ListItem
          key={item.id}
          id={item.id}
          name={item.name}
          completed={item.completed ?? false}
          onChange={(name, completed) => handleChange(item.id, name, completed)}
        />
      ))}
    </ul>
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
