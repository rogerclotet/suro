"use client";

import type { List } from "@/app/_data/list";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React, { Fragment } from "react";
import { deleteListItem, updateListItem } from "./actions";
import ListItem from "./list-item";
import NewListItem from "./new-list-item";

export default function CheckList(props: { list: List }) {
  const [itemsByCategory, setItemsByCategory] = React.useState(
    groupItemsByCategory(props.list.items),
  );
  const [animationParent] = useAutoAnimate();

  React.useEffect(() => {
    setItemsByCategory(groupItemsByCategory(props.list.items));
  }, [props.list.items]);

  async function handleChange(
    item: List["items"][number],
    name: string,
    completed: boolean,
  ) {
    item.name = name;
    item.completed = completed;
    item.updatedAt = new Date();

    setItemsByCategory(groupItemsByCategory(props.list.items));

    await updateListItem(props.list, item.id, name, completed);
  }

  async function handleDelete(item: List["items"][number]) {
    setItemsByCategory(
      groupItemsByCategory(props.list.items.filter((i) => i.id !== item.id)),
    );
    await deleteListItem(props.list, item.id);
  }

  return (
    <div className="w-full">
      <ul
        ref={animationParent}
        className="mx-auto flex flex-col items-stretch gap-1 lg:max-w-lg"
      >
        <NewListItem list={props.list} />

        {itemsByCategory.map(({ category, items }) => (
          <Fragment key={category}>
            <h3 key={`title_${category}`} className="text-lg font-semibold">
              {category}
            </h3>
            {items.map((item) => (
              <ListItem
                key={item.id}
                list={props.list}
                id={item.id}
                name={item.name}
                completed={item.completed ?? false}
                onChange={(name, completed) =>
                  handleChange(item, name, completed)
                }
                onDelete={() => handleDelete(item)}
              />
            ))}
          </Fragment>
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
