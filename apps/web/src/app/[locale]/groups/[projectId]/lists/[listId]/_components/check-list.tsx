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
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { List, ListItem } from "@/app/_data/list";
import CategoryItems from "./category-items";
import NewListItem from "./list-item/new-list-item";

export default function CheckList(props: { list: List }) {
  const list = props.list;
  const t = useTranslations("lists");

  const [dragging, setDragging] = useState(false);
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const updateItem = useMutation(api.listItems.update);
  const removeItem = useMutation(api.listItems.remove);

  // Keep a ref to the latest list so stable callbacks can read current state.
  const listRef = useRef(list);
  // eslint-disable-next-line react-hooks/refs
  listRef.current = list;

  const itemsByCategory = useMemo(
    () => groupItemsByCategory(list.items),
    [list.items],
  );

  const handleChange = useCallback(
    async (
      item: List["items"][number],
      name: string,
      details: string,
      completed: boolean,
      category: string | null,
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
          category,
        });
      } catch (e) {
        toast.error(t("itemUpdateError"));
        throw e;
      }
    },
    [updateItem, t],
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

    const category = categoryName === "" ? null : categoryName;
    if (category === item.category) {
      return;
    }

    if (
      currentList.items.find(
        (i) => i.category === category && i.name === item.name,
      )
    ) {
      toast.error(t("itemAlreadyExistsInCategory"));
      return;
    }

    await updateItem({
      itemId: item.id as Id<"listItems">,
      name: item.name,
      details: item.details ?? "",
      completed: item.completed ?? false,
      category,
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

/**
 * Group the list's items into sections by category name. Sections exist only
 * while items use them; the empty-name bucket ("no category") is always
 * present so it stays a drop target while dragging.
 */
function groupItemsByCategory(items: List["items"]) {
  const categories = new Map<string, List["items"]>([["", []]]);

  for (const item of items) {
    const category = item.category ?? "";
    const bucket = categories.get(category);
    if (bucket) {
      bucket.push(item);
    } else {
      categories.set(category, [item]);
    }
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
