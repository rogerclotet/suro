import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { overlayItems, overlaySpendings } from "./overlay";
import type { OutboxEntry } from "./types";

function entry(
  over: Partial<OutboxEntry> & Pick<OutboxEntry, "functionName">,
): OutboxEntry {
  return {
    id: over.id ?? "e",
    functionName: over.functionName,
    args: over.args ?? {},
    tempIds: over.tempIds ?? [],
    dependsOn: over.dependsOn ?? [],
    createdAt: over.createdAt ?? 0,
    status: over.status ?? "pending",
    attempts: over.attempts ?? 0,
  };
}

function item(over: {
  _id: string;
  name: string;
  completed?: boolean;
  listId?: string;
  createdBy?: string;
  category?: string;
  details?: string;
  _creationTime?: number;
  updatedAt?: number;
  dueAt?: number;
  dueAllDay?: boolean;
  assigneeId?: string;
  priority?: Doc<"listItems">["priority"];
  recurrence?: Doc<"listItems">["recurrence"];
}): Doc<"listItems"> {
  return {
    _id: over._id as Id<"listItems">,
    _creationTime: over._creationTime ?? 0,
    name: over.name,
    completed: over.completed ?? false,
    listId: (over.listId ?? "list-1") as Id<"lists">,
    createdBy: (over.createdBy ?? "u1") as Id<"users">,
    updatedAt: over.updatedAt ?? 0,
    category: over.category,
    details: over.details,
    dueAt: over.dueAt,
    dueAllDay: over.dueAllDay,
    assigneeId: over.assigneeId as Id<"users"> | undefined,
    priority: over.priority,
    recurrence: over.recurrence,
  };
}

const ME = { createdBy: "u1" as Id<"users"> };

describe("overlayItems", () => {
  it("appends a pending create to its own list", () => {
    const out = overlayItems(
      [item({ _id: "i1", name: "eggs" })],
      "list-1",
      [
        entry({
          functionName: "listItems:create",
          tempIds: ["temp-9"],
          args: { listId: "list-1", name: "milk" },
        }),
      ],
      {},
      ME,
    );
    expect(out.map((i) => i.name)).toEqual(["eggs", "milk"]);
    expect(out[1]?._id).toBe("temp-9");
  });

  it("ignores creates for a different list", () => {
    const out = overlayItems(
      [],
      "list-1",
      [
        entry({
          functionName: "listItems:create",
          tempIds: ["temp-9"],
          args: { listId: "other", name: "x" },
        }),
      ],
      {},
      ME,
    );
    expect(out).toEqual([]);
  });

  it("applies update and remove", () => {
    const out = overlayItems(
      [item({ _id: "i1", name: "eggs" }), item({ _id: "i2", name: "milk" })],
      "list-1",
      [
        entry({
          functionName: "listItems:update",
          args: { itemId: "i1", name: "eggs", completed: true },
        }),
        entry({ functionName: "listItems:remove", args: { itemId: "i2" } }),
      ],
      {},
      ME,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.completed).toBe(true);
  });

  it("skips a create already synced via idmap", () => {
    const out = overlayItems(
      [item({ _id: "real-1", name: "milk" })],
      "list-1",
      [
        entry({
          functionName: "listItems:create",
          tempIds: ["temp-9"],
          args: { listId: "list-1", name: "milk" },
        }),
      ],
      { "temp-9": "real-1" },
      ME,
    );
    expect(out).toHaveLength(1);
  });

  it("matches an update to a temp item created in the same batch", () => {
    const out = overlayItems(
      [],
      "list-1",
      [
        entry({
          functionName: "listItems:create",
          tempIds: ["temp-9"],
          args: { listId: "list-1", name: "milk" },
        }),
        entry({
          functionName: "listItems:update",
          args: { itemId: "temp-9", name: "oat milk", completed: false },
        }),
      ],
      {},
      ME,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.name).toBe("oat milk");
  });

  it("clears completed items", () => {
    const out = overlayItems(
      [
        item({ _id: "i1", name: "a", completed: true }),
        item({ _id: "i2", name: "b" }),
      ],
      "list-1",
      [
        entry({
          functionName: "lists:clearCompleted",
          args: { listId: "list-1" },
        }),
      ],
      {},
      ME,
    );
    expect(out.map((i) => i.name)).toEqual(["b"]);
  });

  it("carries task fields onto a created temp item", () => {
    const out = overlayItems(
      [],
      "list-1",
      [
        entry({
          functionName: "listItems:create",
          tempIds: ["temp-1"],
          args: {
            listId: "list-1",
            name: "pay rent",
            dueAt: 1000,
            dueAllDay: true,
            assigneeId: "u2",
            priority: "high",
            recurrence: { freq: "monthly", interval: 1 },
          },
        }),
      ],
      {},
      ME,
    );
    expect(out[0]?.dueAt).toBe(1000);
    expect(out[0]?.dueAllDay).toBe(true);
    expect(out[0]?.assigneeId).toBe("u2");
    expect(out[0]?.priority).toBe("high");
    expect(out[0]?.recurrence).toEqual({ freq: "monthly", interval: 1 });
  });

  it("updates task fields and clears omitted ones (non-sticky)", () => {
    const out = overlayItems(
      [
        item({
          _id: "i1",
          name: "task",
          dueAt: 5,
          assigneeId: "u2",
          priority: "high",
        }),
      ],
      "list-1",
      [
        entry({
          functionName: "listItems:update",
          args: {
            itemId: "i1",
            name: "task",
            completed: false,
            priority: "low",
            // dueAt/assigneeId omitted -> cleared
          },
        }),
      ],
      {},
      ME,
    );
    expect(out[0]?.priority).toBe("low");
    expect(out[0]?.dueAt).toBeUndefined();
    expect(out[0]?.assigneeId).toBeUndefined();
  });

  it("reschedules instead of completing a recurring task (advances dueAt)", () => {
    const due = Date.UTC(2026, 0, 10);
    const out = overlayItems(
      [item({ _id: "i1", name: "water plants", dueAt: due })],
      "list-1",
      [
        entry({
          functionName: "listItems:update",
          createdAt: Date.UTC(2026, 0, 10, 12),
          args: {
            itemId: "i1",
            name: "water plants",
            completed: true,
            dueAt: due,
            recurrence: { freq: "daily", interval: 1 },
          },
        }),
      ],
      {},
      ME,
    );
    // Stays open, advanced to the next future occurrence (Jan 11).
    expect(out[0]?.completed).toBe(false);
    expect(out[0]?.dueAt).toBe(Date.UTC(2026, 0, 11));
  });

  it("completes a recurring task when the repeat is cleared in the same edit", () => {
    const out = overlayItems(
      [
        item({
          _id: "i1",
          name: "task",
          recurrence: { freq: "daily", interval: 1 },
        }),
      ],
      "list-1",
      [
        entry({
          functionName: "listItems:update",
          args: { itemId: "i1", name: "task", completed: true },
        }),
      ],
      {},
      ME,
    );
    expect(out[0]?.completed).toBe(true);
    expect(out[0]?.recurrence).toBeUndefined();
  });
});

describe("overlaySpendings", () => {
  const ctx = {
    projectId: "p1" as Id<"projects">,
    createdBy: "u1" as Id<"users">,
    nameById: new Map<Id<"users">, string | null>([
      ["u1" as Id<"users">, "Ann"],
      ["u2" as Id<"users">, "Bob"],
    ]),
  };

  it("prepends a pending spending with resolved names", () => {
    const out = overlaySpendings(
      [],
      "pot-1",
      [
        entry({
          functionName: "expenses:createSpending",
          tempIds: ["temp-s1"],
          createdAt: 10,
          args: { potId: "pot-1", amount: 500, from: "u1", to: "u2" },
        }),
      ],
      {},
      ctx,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.amount).toBe(500);
    expect(out[0]?.fromName).toBe("Ann");
    expect(out[0]?.toName).toBe("Bob");
  });

  it("ignores spendings for another pot", () => {
    const out = overlaySpendings(
      [],
      "pot-1",
      [
        entry({
          functionName: "expenses:createSpending",
          tempIds: ["temp-s1"],
          args: { potId: "pot-2", amount: 1, from: "u1" },
        }),
      ],
      {},
      ctx,
    );
    expect(out).toEqual([]);
  });

  it("expands a settle into per-payment rows", () => {
    const out = overlaySpendings(
      [],
      "pot-1",
      [
        entry({
          functionName: "expenses:settlePayments",
          id: "s",
          args: {
            potId: "pot-1",
            payments: [{ from: "u2", to: "u1", amount: 250 }],
          },
        }),
      ],
      {},
      ctx,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.description).toBe("Settle up");
    expect(out[0]?.amount).toBe(250);
  });
});
