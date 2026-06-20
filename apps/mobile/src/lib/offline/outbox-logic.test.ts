import { describe, expect, it } from "vitest";
import { compact, hasUnresolvedTemp, remapArgs } from "./outbox-logic";
import type { OutboxEntry } from "./types";

function entry(
  over: Partial<OutboxEntry> & Pick<OutboxEntry, "functionName">,
): OutboxEntry {
  return {
    id: over.id ?? Math.random().toString(),
    functionName: over.functionName,
    args: over.args ?? {},
    tempIds: over.tempIds ?? [],
    dependsOn: over.dependsOn ?? [],
    createdAt: over.createdAt ?? 0,
    status: over.status ?? "pending",
    attempts: over.attempts ?? 0,
  };
}

describe("compact", () => {
  it("drops a create→child→delete chain for an offline-only entity", () => {
    const entries = [
      entry({
        functionName: "lists:create",
        tempIds: ["temp-lists-1"],
        args: { name: "x" },
      }),
      entry({
        functionName: "listItems:create",
        tempIds: ["temp-listItems-2"],
        dependsOn: ["temp-lists-1"],
        args: { listId: "temp-lists-1", name: "milk" },
      }),
      entry({ functionName: "lists:remove", args: { listId: "temp-lists-1" } }),
    ];
    expect(compact(entries)).toEqual([]);
  });

  it("drops an offline pot, its spending, and its delete", () => {
    const entries = [
      entry({
        functionName: "expenses:createPot",
        tempIds: ["temp-pots-1"],
        args: { name: "trip" },
      }),
      entry({
        functionName: "expenses:createSpending",
        tempIds: ["temp-spendings-2"],
        dependsOn: ["temp-pots-1"],
        args: { potId: "temp-pots-1", amount: 100, from: "u1" },
      }),
      entry({
        functionName: "expenses:deletePot",
        args: { potId: "temp-pots-1" },
      }),
    ];
    expect(compact(entries)).toEqual([]);
  });

  it("keeps a create+update chain with no delete", () => {
    const entries = [
      entry({
        functionName: "lists:create",
        tempIds: ["temp-lists-1"],
        args: { name: "x" },
      }),
      entry({
        functionName: "lists:update",
        args: { listId: "temp-lists-1", name: "y" },
      }),
    ];
    expect(compact(entries)).toHaveLength(2);
  });

  it("does not cancel deletes of real (synced) ids", () => {
    const entries = [
      entry({
        functionName: "listItems:remove",
        args: { itemId: "real-item-1" },
      }),
    ];
    expect(compact(entries)).toHaveLength(1);
  });
});

describe("remapArgs", () => {
  it("replaces temp ids with resolved server ids", () => {
    expect(
      remapArgs(
        { potId: "temp-pots-1", from: "real-user", amount: 100 },
        { "temp-pots-1": "real-pot" },
      ),
    ).toEqual({ potId: "real-pot", from: "real-user", amount: 100 });
  });

  it("leaves a temp id untouched when unresolved", () => {
    expect(remapArgs({ potId: "temp-pots-9" }, {})).toEqual({
      potId: "temp-pots-9",
    });
  });
});

describe("hasUnresolvedTemp", () => {
  it("detects an unresolved temp id arg", () => {
    expect(hasUnresolvedTemp({ potId: "temp-pots-9", from: "u1" })).toBe(true);
    expect(hasUnresolvedTemp({ potId: "real-pot", from: "u1" })).toBe(false);
  });
});
