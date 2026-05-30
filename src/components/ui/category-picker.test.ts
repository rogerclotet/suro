import { describe, expect, it } from "vitest";
import { buildCategoryRows } from "./category-picker";

const categories = [
  { id: "1", name: "Fruits" },
  { id: "2", name: "Vegetables" },
  { id: "3", name: "Frozen" },
];

describe("buildCategoryRows", () => {
  it("lists a 'no category' row plus all categories when the query is empty", () => {
    const rows = buildCategoryRows(categories, "");

    expect(rows.map((r) => r.type)).toEqual([
      "none",
      "category",
      "category",
      "category",
    ]);
  });

  it("filters categories case-insensitively by the query", () => {
    const rows = buildCategoryRows(categories, "fr");

    expect(rows).toEqual([
      { type: "category", category: { id: "1", name: "Fruits" } },
      { type: "category", category: { id: "3", name: "Frozen" } },
      { type: "create", name: "fr" },
    ]);
  });

  it("offers a create row when the query has no exact match", () => {
    const rows = buildCategoryRows(categories, "Dairy");

    expect(rows).toEqual([{ type: "create", name: "Dairy" }]);
  });

  it("does not offer a create row when an exact (trimmed, case-insensitive) match exists", () => {
    const rows = buildCategoryRows(categories, "  fruits  ");

    expect(rows.some((r) => r.type === "create")).toBe(false);
    expect(rows).toEqual([
      { type: "category", category: { id: "1", name: "Fruits" } },
    ]);
  });

  it("offers create alongside partial matches", () => {
    const rows = buildCategoryRows(categories, "Fro");

    expect(rows).toEqual([
      { type: "category", category: { id: "3", name: "Frozen" } },
      { type: "create", name: "Fro" },
    ]);
  });
});
