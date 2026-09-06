import type { Id } from "backend/convex/_generated/dataModel";
import { expect, it } from "vitest";
import { groupByCategory } from "./sections";
import type { Item } from "./types";

const item = (id: string, category?: string): Item => ({
  _id: id as Id<"listItems">,
  _creationTime: 0,
  listId: "list" as Id<"lists">,
  name: id,
  completed: false,
  createdBy: "user" as Id<"users">,
  updatedAt: 0,
  category,
});

it("keeps a named category distinct from the translated uncategorized label", () => {
  const sections = groupByCategory(
    [item("plain"), item("named", "No category")],
    "No category",
    true,
  );
  expect(
    sections.map((section) => ({
      category: section.category,
      ids: section.data.map((item) => item._id),
    })),
  ).toEqual([
    { category: null, ids: ["plain"] },
    { category: "No category", ids: ["named"] },
  ]);
});

it("sorts optimistic task edits by due date and completion without changing the source", () => {
  const items = [
    { ...item("later"), dueAt: 20 },
    { ...item("earlier"), dueAt: 10 },
    { ...item("done"), dueAt: 1, completed: true },
  ];
  expect(
    groupByCategory(items, "Other", true)[0]?.data.map((item) => item._id),
  ).toEqual(["earlier", "later", "done"]);
  expect(items[0]?._id).toBe("later");
});
