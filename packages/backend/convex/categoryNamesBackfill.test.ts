import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

it("copies category names onto items and clears the legacy FK", async () => {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { name: "Alice" });
    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "token",
      color: "blue",
    });
    const groceries = await ctx.db.insert("categories", {
      name: "Groceries",
      projectId: family,
    });
    const dangling = await ctx.db.insert("categories", {
      name: "Doomed",
      projectId: family,
    });
    await ctx.db.delete(dangling);
    const list = await ctx.db.insert("lists", {
      name: "L",
      description: "",
      projectId: family,
      favorite: false,
      createdBy: alice,
      updatedAt: Date.now(),
    });
    const withCategory = await ctx.db.insert("listItems", {
      name: "Milk",
      completed: false,
      listId: list,
      categoryId: groceries,
      createdBy: alice,
      updatedAt: Date.now(),
    });
    const withDangling = await ctx.db.insert("listItems", {
      name: "Ghost",
      completed: false,
      listId: list,
      categoryId: dangling,
      createdBy: alice,
      updatedAt: Date.now(),
    });
    const without = await ctx.db.insert("listItems", {
      name: "Plain",
      completed: false,
      listId: list,
      createdBy: alice,
      updatedAt: Date.now(),
    });
    return { withCategory, withDangling, without };
  });

  await t.mutation(internal.categoryNamesBackfill.run, {});
  await t.finishAllScheduledFunctions(() => {});

  await t.run(async (ctx) => {
    const milk = await ctx.db.get(ids.withCategory);
    expect(milk?.category).toBe("Groceries");
    expect(milk?.categoryId).toBeUndefined();
    // A dangling id degrades to "no category" (same as the old orphaning).
    const ghost = await ctx.db.get(ids.withDangling);
    expect(ghost?.category).toBeUndefined();
    expect(ghost?.categoryId).toBeUndefined();
    const plain = await ctx.db.get(ids.without);
    expect(plain?.category).toBeUndefined();
  });
});

it("rewrites template item category ids to names", async () => {
  const t = convexTest(schema, modules);
  const templateId = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { name: "Alice" });
    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "token-family",
      color: "blue",
    });
    const other = await ctx.db.insert("projects", {
      name: "Other",
      createdBy: alice,
      inviteToken: "token-other",
      color: "red",
    });
    const groceries = await ctx.db.insert("categories", {
      name: "Groceries",
      projectId: family,
    });
    const foreign = await ctx.db.insert("categories", {
      name: "Foreign",
      projectId: other,
    });
    return ctx.db.insert("listTemplates", {
      name: "Starter",
      items: [
        { name: "Milk", category: groceries },
        { name: "Eggs", category: null },
        { name: "Sunscreen", category: foreign }, // cross-project id
        { name: "Bread", category: "Bakery" }, // already a name
      ],
      projectId: family,
      createdBy: alice,
      updatedAt: Date.now(),
    });
  });

  await t.mutation(internal.categoryNamesBackfill.templates, {});

  await t.run(async (ctx) => {
    const template = await ctx.db.get(templateId);
    expect(template?.items).toEqual([
      { name: "Milk", category: "Groceries" },
      { name: "Eggs", category: null },
      { name: "Sunscreen", category: null },
      { name: "Bread", category: "Bakery" },
    ]);
  });
});
