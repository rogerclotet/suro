import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { compareTaskItems } from "./task-order";

function item(over: {
  _id: string;
  name?: string;
  completed?: boolean;
  dueAt?: number;
  priority?: Doc<"listItems">["priority"];
}): Pick<
  Doc<"listItems">,
  "completed" | "dueAt" | "priority" | "name" | "_id"
> {
  return {
    _id: over._id as Id<"listItems">,
    name: over.name ?? over._id,
    completed: over.completed ?? false,
    dueAt: over.dueAt,
    priority: over.priority,
  };
}

function sorted(items: ReturnType<typeof item>[]): string[] {
  return [...items].sort(compareTaskItems).map((i) => i._id);
}

describe("compareTaskItems", () => {
  it("puts completed items last", () => {
    expect(
      sorted([item({ _id: "done", completed: true }), item({ _id: "open" })]),
    ).toEqual(["open", "done"]);
  });

  it("sorts by due date ascending, no-due last", () => {
    expect(
      sorted([
        item({ _id: "none" }),
        item({ _id: "late", dueAt: 200 }),
        item({ _id: "soon", dueAt: 100 }),
      ]),
    ).toEqual(["soon", "late", "none"]);
  });

  it("breaks a due-date tie by priority (high first)", () => {
    expect(
      sorted([
        item({ _id: "low", dueAt: 100, priority: "low" }),
        item({ _id: "high", dueAt: 100, priority: "high" }),
        item({ _id: "normal", dueAt: 100, priority: "normal" }),
      ]),
    ).toEqual(["high", "normal", "low"]);
  });

  it("treats missing priority as normal", () => {
    expect(
      sorted([
        item({ _id: "low", dueAt: 100, priority: "low" }),
        item({ _id: "plain", dueAt: 100 }),
      ]),
    ).toEqual(["plain", "low"]);
  });

  it("falls back to name then id", () => {
    expect(
      sorted([
        item({ _id: "b", name: "same" }),
        item({ _id: "a", name: "same" }),
      ]),
    ).toEqual(["a", "b"]);
  });
});
