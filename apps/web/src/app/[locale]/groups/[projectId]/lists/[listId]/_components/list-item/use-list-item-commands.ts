"use client";

import { api } from "backend/convex/_generated/api";
import type { Doc } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { advanceDueAt, completionPatch } from "domain/tasks";
import type { List } from "@/app/_data/list";
import { updateListItems } from "@/lib/queries/update-list-items";

type ItemDoc = Doc<"listItems">;

/** Mirrors the server's category normalization closely enough to place the row. */
function normalizedCategory(category: string | null | undefined) {
  return category?.trim() || undefined;
}

/**
 * Item mutations that project their result into the cached list right away,
 * so a toggle or move animates on the same frame as the click instead of
 * after a server round trip. Each projection mirrors its server handler.
 */
export default function useListItemCommands(list: List) {
  const patchItem = (
    store: Parameters<typeof updateListItems>[0],
    itemId: string,
    patch: (item: ItemDoc) => ItemDoc,
  ) =>
    updateListItems(store, list, (items) =>
      items.map((item) => (item._id === itemId ? patch(item) : item)),
    );

  const setCompleted = useMutation(
    api.listItems.setCompleted,
  ).withOptimisticUpdate((store, args) => {
    const now = Date.now();
    patchItem(store, args.itemId, (item) => {
      const patch = completionPatch(item, { ...args, now });
      return patch ? { ...item, ...patch, updatedAt: now } : item;
    });
  });

  const setCategory = useMutation(
    api.listItems.setCategory,
  ).withOptimisticUpdate((store, args) => {
    patchItem(store, args.itemId, (item) => ({
      ...item,
      category: normalizedCategory(args.category),
    }));
  });

  // A full replacement: absent task fields clear, like on the server.
  const update = useMutation(api.listItems.update).withOptimisticUpdate(
    (store, args) => {
      const now = Date.now();
      patchItem(store, args.itemId, (item) => {
        // A recurring task checked off advances instead of completing.
        const rescheduled =
          args.recurrence !== undefined && args.completed && !item.completed;
        return {
          ...item,
          name: args.name,
          details: args.details?.trim() || undefined,
          category: normalizedCategory(args.category),
          completed: rescheduled ? false : args.completed,
          dueAt:
            rescheduled && args.recurrence
              ? advanceDueAt(args.dueAt ?? now, args.recurrence, now)
              : args.dueAt,
          dueAllDay: args.dueAllDay,
          assigneeId: args.assigneeId,
          priority: args.priority,
          recurrence: args.recurrence,
          updatedAt: now,
        };
      });
    },
  );

  const remove = useMutation(api.listItems.remove).withOptimisticUpdate(
    (store, args) => {
      updateListItems(store, list, (items) =>
        items.filter((item) => item._id !== args.itemId),
      );
    },
  );

  return { setCompleted, setCategory, update, remove };
}
