"use client";

import type { List } from "@/app/_data/list";
import { updateListItem } from "./actions";
import ListItem from "./list-item";
import NewListItem from "./new-list-item";

export default function CheckList({ list }: { list: List }) {
  async function handleChange(
    itemId: string,
    name: string,
    completed: boolean,
  ) {
    await updateListItem(list, itemId, name, completed);
  }

  return (
    <ul className="flex flex-col items-stretch gap-1 pt-6 lg:items-center">
      <NewListItem list={list} />

      {list.items.map((item) => (
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
