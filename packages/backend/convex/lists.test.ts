import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

// Normalized shapes for whole-list assertions, independent of Convex
// bookkeeping fields (_id, timestamps, …).
type NormalizedItem = {
  name: string;
  details: string | null;
  completed: boolean;
  category: string | null;
};
type NormalizedList = {
  name: string;
  description: string | null;
  favorite: boolean;
  items: NormalizedItem[];
};
function normalizeList(list: {
  name: string;
  description?: string | null;
  favorite: boolean;
  items: {
    name: string;
    details?: string | null;
    completed: boolean;
    category?: string | null;
  }[];
}): NormalizedList {
  return {
    name: list.name,
    description: list.description ?? null,
    favorite: list.favorite,
    items: list.items.map((item) => ({
      name: item.name,
      details: item.details ?? null,
      completed: item.completed,
      category: item.category ?? null,
    })),
  };
}

// `lists.get` returns null for a missing list; tests that expect a present
// list assert non-null here so the value is narrowed for the assertions below.
async function getList(
  actor: ReturnType<ReturnType<typeof setup>["withIdentity"]>,
  listId: Id<"lists">,
) {
  const list = await actor.query(api.lists.get, { listId });
  expect(list).not.toBeNull();
  return list as NonNullable<typeof list>;
}

type Ids = {
  alice: Id<"users">;
  bob: Id<"users">;
  family: Id<"projects">;
  other: Id<"projects">;
  groceries: Id<"categories">;
  foreign: Id<"categories">;
};

function setup() {
  const t = convexTest(schema, modules);
  return t;
}

async function seed(t: ReturnType<typeof setup>): Promise<Ids> {
  return t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", {
      name: "Alice",
      email: "alice@example.test",
    });
    const bob = await ctx.db.insert("users", {
      name: "Bob",
      email: "bob@example.test",
    });
    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "token-family",
      color: "blue",
    });
    const other = await ctx.db.insert("projects", {
      name: "Other",
      createdBy: bob,
      inviteToken: "token-other",
      color: "red",
    });
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: other, userId: bob });
    const groceries = await ctx.db.insert("categories", {
      name: "Groceries",
      projectId: family,
    });
    const foreign = await ctx.db.insert("categories", {
      name: "Foreign",
      projectId: other,
    });
    return { alice, bob, family, other, groceries, foreign };
  });
}

let t: ReturnType<typeof setup>;
let ids: Ids;
let alice: ReturnType<ReturnType<typeof setup>["withIdentity"]>;
let bob: ReturnType<ReturnType<typeof setup>["withIdentity"]>;

beforeEach(async () => {
  t = setup();
  ids = await seed(t);
  alice = t.withIdentity({ subject: `${ids.alice}|session` });
  bob = t.withIdentity({ subject: `${ids.bob}|session` });
});

// Direct-insert helpers (testing reads/sort, not the create path).
function insertList(
  name: string,
  opts: { favorite?: boolean; updatedAt?: number } = {},
) {
  return t.run((ctx) =>
    ctx.db.insert("lists", {
      name,
      description: "",
      projectId: ids.family,
      favorite: opts.favorite ?? false,
      createdBy: ids.alice,
      updatedAt: opts.updatedAt ?? Date.now(),
    }),
  );
}
function insertItem(
  listId: Id<"lists">,
  name: string,
  opts: { completed?: boolean; category?: string; updatedAt?: number } = {},
) {
  return t.run((ctx) =>
    ctx.db.insert("listItems", {
      name,
      completed: opts.completed ?? false,
      listId,
      category: opts.category,
      createdBy: ids.alice,
      updatedAt: opts.updatedAt ?? Date.now(),
    }),
  );
}

describe("lists: create & read", () => {
  it("creates a list (trimming the name) and reads it back empty", async () => {
    const id = await alice.mutation(api.lists.create, {
      projectId: ids.family,
      name: "  Camping  ",
      description: "",
    });
    expect(normalizeList(await getList(alice, id))).toEqual({
      name: "Camping",
      description: "",
      favorite: false,
      items: [],
    });
  });

  it("seeds items from templates, copying category names verbatim", async () => {
    const tpl = await t.run((ctx) =>
      ctx.db.insert("listTemplates", {
        name: "Starter",
        items: [
          { name: "Milk", category: "Groceries" },
          { name: "Eggs", category: null },
          { name: "Sunscreen", category: "Beach" }, // brand-new section name
        ],
        projectId: ids.family,
        createdBy: ids.alice,
        updatedAt: Date.now(),
      }),
    );

    const id = await alice.mutation(api.lists.create, {
      projectId: ids.family,
      name: "Trip",
      description: "",
      templateIds: [tpl],
    });

    expect(normalizeList(await getList(alice, id))).toEqual({
      name: "Trip",
      description: "",
      favorite: false,
      items: [
        { name: "Eggs", details: null, completed: false, category: null },
        {
          name: "Milk",
          details: null,
          completed: false,
          category: "Groceries",
        },
        {
          name: "Sunscreen",
          details: null,
          completed: false,
          category: "Beach",
        },
      ],
    });

    // Seeding also records the names as suggestions for the project.
    const suggestions = await alice.query(api.categories.listByProject, {
      projectId: ids.family,
    });
    expect(suggestions.map((c) => c.name)).toEqual(["Beach", "Groceries"]);
  });

  // Transitional (drop with listItems.categoryId): templates saved before the
  // rework carry category *ids* — same-project ids resolve to their name,
  // foreign ones degrade to "no category".
  it("seeds items from pre-rework templates holding category ids", async () => {
    const tpl = await t.run((ctx) =>
      ctx.db.insert("listTemplates", {
        name: "Legacy",
        items: [
          { name: "Milk", category: ids.groceries },
          { name: "Sunscreen", category: ids.foreign }, // another project
        ],
        projectId: ids.family,
        createdBy: ids.alice,
        updatedAt: Date.now(),
      }),
    );

    const id = await alice.mutation(api.lists.create, {
      projectId: ids.family,
      name: "Trip",
      description: "",
      templateIds: [tpl],
    });

    expect(normalizeList(await getList(alice, id)).items).toEqual([
      { name: "Milk", details: null, completed: false, category: "Groceries" },
      { name: "Sunscreen", details: null, completed: false, category: null },
    ]);
  });

  it("sorts items uncompleted-first then by name", async () => {
    const list = await insertList("Sort");
    await insertItem(list, "Banana", { completed: true });
    await insertItem(list, "Apple");
    await insertItem(list, "Cherry");
    await insertItem(list, "Date", { completed: true });

    const result = await getList(alice, list);
    expect(result.items.map((i) => i.name)).toEqual([
      "Apple",
      "Cherry",
      "Banana",
      "Date",
    ]);
  });

  it("orders the overview by updatedAt desc", async () => {
    await insertList("Older", { updatedAt: Date.parse("2024-01-01") });
    await insertList("Newer", { updatedAt: Date.parse("2024-06-01") });
    const lists = await alice.query(api.lists.listByProject, {
      projectId: ids.family,
    });
    expect(lists.map((l) => l.name)).toEqual(["Newer", "Older"]);
  });
});

describe("lists: overview", () => {
  function overview(completedLimit: number) {
    return alice.query(api.lists.overviewByProject, {
      projectId: ids.family,
      completedLimit,
    });
  }

  it("keeps favorites and unfinished lists active; empty lists too", async () => {
    const fav = await insertList("Fav done", { favorite: true });
    await insertItem(fav, "A", { completed: true });
    const open = await insertList("In progress");
    await insertItem(open, "B", { completed: false });
    await insertList("Empty");
    const done = await insertList("Done");
    await insertItem(done, "C", { completed: true });

    const result = await overview(5);
    expect(result.active.map((l) => l.name).sort()).toEqual([
      "Empty",
      "Fav done",
      "In progress",
    ]);
    expect(result.completed.map((l) => l.name)).toEqual(["Done"]);
    expect(result.hasMoreCompleted).toBe(false);
  });

  it("orders completed by last item check desc and pages by the limit", async () => {
    for (const [name, checkedAt] of [
      ["First", Date.parse("2024-01-01")],
      ["Third", Date.parse("2024-03-01")],
      ["Second", Date.parse("2024-02-01")],
    ] as const) {
      const list = await insertList(name, { updatedAt: 0 });
      await insertItem(list, "Item", { completed: true, updatedAt: checkedAt });
    }

    const page = await overview(2);
    expect(page.completed.map((l) => l.name)).toEqual(["Third", "Second"]);
    expect(page.hasMoreCompleted).toBe(true);

    const all = await overview(3);
    expect(all.completed.map((l) => l.name)).toEqual([
      "Third",
      "Second",
      "First",
    ]);
    expect(all.hasMoreCompleted).toBe(false);
  });

  it("rejects non-members", async () => {
    await expect(
      bob.query(api.lists.overviewByProject, {
        projectId: ids.family,
        completedLimit: 5,
      }),
    ).rejects.toThrow();
  });
});

describe("lists: authorization", () => {
  // Divergence from the Next.js app: it swallowed errors and returned
  // undefined/[] for non-members. Convex surfaces authorization as errors. The
  // security property (non-members can't read) holds either way.
  it("rejects non-members (opaque not-found error)", async () => {
    const list = await insertList("Secret");
    await expect(
      alice.query(api.lists.get, { listId: list }),
    ).resolves.toBeDefined();
    await expect(bob.query(api.lists.get, { listId: list })).rejects.toThrow();
    await expect(
      bob.query(api.lists.listByProject, { projectId: ids.family }),
    ).rejects.toThrow();
  });
});

describe("list items", () => {
  it("creates items carrying their category name, trimming it", async () => {
    const list = await insertList("L");
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Apples",
      category: " Groceries ",
    });
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Towels",
      category: null,
    });

    const result = await getList(alice, list);
    const apples = result.items.find((i) => i.name === "Apples");
    const towels = result.items.find((i) => i.name === "Towels");
    expect(apples?.category).toBe("Groceries");
    expect(towels?.category).toBeUndefined();
  });

  it("updates name/details/completed/category", async () => {
    const list = await insertList("L");
    const item = await insertItem(list, "Tent");
    await alice.mutation(api.listItems.update, {
      itemId: item,
      name: "Big Tent",
      details: "2-person",
      completed: true,
      category: "Camping",
    });

    const result = await getList(alice, list);
    const updated = result.items.find((i) => i._id === item);
    expect(updated?.name).toBe("Big Tent");
    expect(updated?.details).toBe("2-person");
    expect(updated?.completed).toBe(true);
    expect(updated?.category).toBe("Camping");
  });

  it("clears the category when given null or a blank name", async () => {
    const list = await insertList("L");
    const item = await insertItem(list, "Tent", { category: "Camping" });
    await alice.mutation(api.listItems.update, {
      itemId: item,
      name: "Tent",
      details: "",
      completed: false,
      category: "   ",
    });
    const result = await getList(alice, list);
    expect(result.items[0]?.category).toBeUndefined();
  });

  // Transitional (drop with listItems.categoryId): pre-rework clients send the
  // category as an id — same-project ids resolve to their name, foreign ones
  // degrade to "no category".
  it("accepts legacy categoryId args from pre-rework clients", async () => {
    const list = await insertList("L");
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Apples",
      categoryId: ids.groceries,
    });
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Towels",
      categoryId: ids.foreign,
    });

    const result = await getList(alice, list);
    const apples = result.items.find((i) => i.name === "Apples");
    const towels = result.items.find((i) => i.name === "Towels");
    expect(apples?.category).toBe("Groceries");
    expect(apples?.categoryId).toBeUndefined();
    expect(towels?.category).toBeUndefined();
  });

  it("rejects updating an item that doesn't exist", async () => {
    const list = await insertList("L");
    const ghost = await insertItem(list, "Ghost");
    await t.run((ctx) => ctx.db.delete(ghost)); // valid id, no longer present
    await expect(
      alice.mutation(api.listItems.update, {
        itemId: ghost,
        name: "x",
        completed: false,
        category: null,
      }),
    ).rejects.toThrow("List item not found");
  });

  it("deletes only the targeted item", async () => {
    const list = await insertList("L");
    await insertItem(list, "Keep");
    const remove = await insertItem(list, "Remove");
    await alice.mutation(api.listItems.remove, { itemId: remove });
    const result = await getList(alice, list);
    expect(result.items.map((i) => i.name)).toEqual(["Keep"]);
  });
});

describe("list settings", () => {
  it("updates name and description", async () => {
    const list = await insertList("Old");
    await alice.mutation(api.lists.update, {
      listId: list,
      name: "New Name",
      description: "desc",
    });
    const result = await getList(alice, list);
    expect(result.name).toBe("New Name");
    expect(result.description).toBe("desc");
  });

  it("toggles favorite back and forth", async () => {
    const list = await insertList("L", { favorite: false });
    await alice.mutation(api.lists.toggleFavorite, { listId: list });
    expect((await getList(alice, list)).favorite).toBe(true);
    await alice.mutation(api.lists.toggleFavorite, { listId: list });
    expect((await getList(alice, list)).favorite).toBe(false);
  });

  it("clears only completed items", async () => {
    const list = await insertList("L");
    await insertItem(list, "Done", { completed: true });
    await insertItem(list, "Todo");
    await alice.mutation(api.lists.clearCompleted, { listId: list });
    const result = await getList(alice, list);
    expect(result.items.map((i) => i.name)).toEqual(["Todo"]);
  });

  it("deletes a list and cascades its items", async () => {
    const list = await insertList("L");
    await insertItem(list, "X");
    await alice.mutation(api.lists.remove, { listId: list });
    // A deleted list reads back as null (not an error) so a still-subscribed
    // detail screen can navigate away cleanly instead of surfacing a server error.
    await expect(
      alice.query(api.lists.get, { listId: list }),
    ).resolves.toBeNull();
    const remaining = await t.run((ctx) =>
      ctx.db
        .query("listItems")
        .withIndex("by_list", (q) => q.eq("listId", list))
        .collect(),
    );
    expect(remaining).toHaveLength(0);
  });
});

describe("category suggestions", () => {
  it("records a fresh name as a suggestion when an item uses it", async () => {
    const list = await insertList("L");
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Milk",
      category: "Dairy",
    });

    const suggestions = await alice.query(api.categories.listByProject, {
      projectId: ids.family,
    });
    // "Groceries" comes from the seed; "Dairy" was just auto-upserted.
    expect(suggestions.map((c) => c.name)).toEqual(["Dairy", "Groceries"]);
  });

  it("doesn't duplicate a suggestion when the same name is reused", async () => {
    const list = await insertList("L");
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Milk",
      category: "Groceries",
    });
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Eggs",
      category: "Groceries",
    });

    const suggestions = await alice.query(api.categories.listByProject, {
      projectId: ids.family,
    });
    expect(suggestions.map((c) => c.name)).toEqual(["Groceries"]);
  });

  it("records no suggestion for blank category names", async () => {
    const list = await insertList("L");
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Milk",
      category: "   ",
    });

    const suggestions = await alice.query(api.categories.listByProject, {
      projectId: ids.family,
    });
    expect(suggestions.map((c) => c.name)).toEqual(["Groceries"]);
  });
});
