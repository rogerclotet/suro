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
import { useStableAutoAnimate } from "@/lib/use-stable-auto-animate";
import CategoryItems from "./category-items";
import { type TaskMutationArgs, taskArgsFromItem } from "./list-item/data";
import NewListItem from "./list-item/new-list-item";

export default function CheckList(props: { list: List }) {
  const list = props.list;
  const t = useTranslations("lists");

  // Animates category sections appearing/disappearing and sliding into place
  // (e.g. a new category created by a move, or one emptied out). Items moving
  // within a section are animated by the section's own list (CategoryItems).
  const sectionsParent = useStableAutoAnimate<HTMLDivElement>();

  const [dragging, setDragging] = useState(false);
  // Which category section's inline add row is expanded (undefined = none;
  // null = the top no-category form, which is always visible and only tracked
  // here so a categorized add collapses any open section row). Set after each
  // add so focus follows the item into the category it went to.
  const [activeAdd, setActiveAdd] = useState<string | null | undefined>(
    undefined,
  );
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
    () => groupItemsByCategory(list.items, true),
    [list.items],
  );

  const handleChange = useCallback(
    async (
      item: List["items"][number],
      name: string,
      details: string,
      completed: boolean,
      category: string | null,
      // Task fields forwarded verbatim: the backend clears any omitted field, so
      // the checkbox toggle and edit form alike must pass the full set.
      task: TaskMutationArgs,
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
          ...task,
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

  const handleAddActivate = useCallback((category: string | null) => {
    setActiveAdd(category);
  }, []);

  // Functional update keyed to the caller's own category so a stale blur from
  // a collapsing row never clears another row's activation (focus-follow).
  const handleAddDeactivate = useCallback((category: string | null) => {
    setActiveAdd((prev) => (prev === category ? undefined : prev));
  }, []);

  const handleAddSubmitted = useCallback((category: string | null) => {
    setActiveAdd(category);
  }, []);

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
      // Recategorizing must preserve the item's task fields (the backend clears
      // any omitted field), so forward them unchanged.
      ...taskArgsFromItem(item),
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
        {/* The always-visible no-category entry point with the quick category
            selector; the uncategorized section sorts first, right below it. */}
        <NewListItem list={list} onSubmitted={handleAddSubmitted} />
      </div>

      <div
        ref={sectionsParent}
        className="mx-auto flex max-w-lg flex-col items-stretch gap-4"
      >
        {itemsByCategory.map(({ category, items }) => (
          <CategoryItems
            key={`category-${category === "" ? "<none>" : category}`}
            category={category}
            items={items}
            list={list}
            isDragging={dragging}
            handleChange={handleChange}
            handleDelete={handleDelete}
            addActive={activeAdd === category}
            onAddActivate={handleAddActivate}
            onAddDeactivate={handleAddDeactivate}
            onAddSubmitted={handleAddSubmitted}
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

/** High first, so it sorts ahead of normal/low on a due-date tie. */
const PRIORITY_RANK: Record<NonNullable<ListItem["priority"]>, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

/**
 * Task-mode order, mirroring the backend's `compareTaskItems`: open first, then
 * due date (no due date last), then priority (high first), then name.
 */
function compareTaskItems(a: ListItem, b: ListItem) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const aDue = a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;
  const aRank = PRIORITY_RANK[a.priority ?? "normal"];
  const bRank = PRIORITY_RANK[b.priority ?? "normal"];
  if (aRank !== bRank) return aRank - bRank;
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a.id.localeCompare(b.id);
}

/**
 * Group the list's items into sections by category name. Sections exist only
 * while items use them; the empty-name bucket ("no category") is always
 * present so it stays a drop target while dragging. Task-mode lists sort each
 * section by due date/priority; plain checklists stay alphabetical.
 */
function groupItemsByCategory(items: List["items"], taskMode: boolean) {
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

  const compare = taskMode ? compareTaskItems : compareItems;
  const result = [];
  for (const [category, categoryItems] of categories.entries()) {
    categoryItems.sort(compare);
    result.push({ category, items: categoryItems });
  }

  // The no-category bucket always sorts first so its items sit right below
  // the always-visible add form at the top (the no-category entry point).
  result.sort((a, b) => {
    if (a.category === "") return -1;
    if (b.category === "") return 1;
    return a.category.localeCompare(b.category);
  });

  return result;
}
