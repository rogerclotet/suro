import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import { getFunctionName } from "convex/server";
import { expect, it, vi } from "vitest";
import { updateListItems } from "./update-list-items";

it("updates a detail-only subscription when adding and reopening an item", () => {
  const item: Doc<"listItems"> = {
    _id: "item" as Id<"listItems">,
    _creationTime: 0,
    listId: "list" as Id<"lists">,
    name: "Milk",
    completed: true,
    createdBy: "user" as Id<"users">,
    updatedAt: 0,
  };
  let items: Doc<"listItems">[] = [];
  const store: OptimisticLocalStore = {
    getQuery: vi.fn((query, ..._args: unknown[]) =>
      getFunctionName(query) === "lists:get"
        ? { _id: "list", items, event: { name: "Dinner" } }
        : undefined,
    ),
    getAllQueries: vi.fn(),
    setQuery: vi.fn((_query, _args, result) => {
      items = result.items;
    }),
  };
  const list = { id: "list", projectId: "project", eventId: null };
  updateListItems(store, list, (items) => [...items, item]);
  expect(items).toEqual([item]);
  updateListItems(store, list, (items) =>
    items.map((item) => ({ ...item, completed: false })),
  );
  expect(items[0]?.completed).toBe(false);
  expect(store.setQuery).toHaveBeenLastCalledWith(
    api.lists.get,
    { listId: "list" },
    expect.objectContaining({ event: { name: "Dinner" } }),
  );
});
