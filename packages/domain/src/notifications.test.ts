import { describe, expect, it } from "vitest";
import {
  type UnreadReceipts,
  unreadItemCount,
  visitedReceiptIds,
} from "./notifications";

const receipts: UnreadReceipts[] = [
  {
    projectId: "group",
    section: "lists",
    ids: ["groceries-2", "chores", "groceries-1", "deleted"],
    targets: [
      { id: "groceries", ids: ["groceries-2", "groceries-1"], gone: false },
      { id: "chores", ids: ["chores"], gone: false },
      { id: "deleted-list", ids: ["deleted"], gone: true },
    ],
  },
  {
    projectId: "group",
    section: "files",
    ids: ["file-1", "file-2"],
    targets: [],
  },
  {
    projectId: "other",
    section: "lists",
    ids: ["elsewhere"],
    targets: [{ id: "groceries", ids: ["elsewhere"], gone: true }],
  },
];

describe("notification visits", () => {
  it("reads only the opened item, never its neighbours or another group", () => {
    expect(
      visitedReceiptIds(receipts, {
        projectId: "group",
        scope: "item",
        id: "groceries",
      }),
    ).toEqual(["groceries-2", "groceries-1"]);
  });

  it("clears only vanished items from a section index", () => {
    expect(
      visitedReceiptIds(receipts, {
        projectId: "group",
        scope: "index",
        section: "lists",
      }),
    ).toEqual(["deleted"]);
  });

  it("reads a whole page-level section", () => {
    expect(
      visitedReceiptIds(receipts, {
        projectId: "group",
        scope: "page",
        section: "files",
      }),
    ).toEqual(["file-1", "file-2"]);
  });

  it("counts an item's receipts within its group", () => {
    expect(unreadItemCount(receipts, "group", "groceries")).toBe(2);
    expect(unreadItemCount(receipts, "group", "missing")).toBe(0);
    expect(unreadItemCount(receipts, "other", "groceries")).toBe(1);
  });
});
