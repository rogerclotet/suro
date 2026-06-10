import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

type Ids = {
  alice: Id<"users">;
  bob: Id<"users">;
  family: Id<"projects">;
  shared: Id<"projects">;
  other: Id<"projects">;
  groceries: Id<"categories">;
  foreign: Id<"categories">;
};

function setup() {
  return convexTest(schema, modules);
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
    // A second project Alice also belongs to — a valid export target.
    const shared = await ctx.db.insert("projects", {
      name: "Shared",
      createdBy: alice,
      inviteToken: "token-shared",
      color: "green",
    });
    // A project Alice is NOT a member of.
    const other = await ctx.db.insert("projects", {
      name: "Other",
      createdBy: bob,
      inviteToken: "token-other",
      color: "red",
    });
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: shared, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: other, userId: bob });
    const groceries = await ctx.db.insert("categories", {
      name: "Groceries",
      projectId: family,
    });
    const foreign = await ctx.db.insert("categories", {
      name: "Foreign",
      projectId: other,
    });
    return { alice, bob, family, shared, other, groceries, foreign };
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

describe("templates: CRUD", () => {
  it("creates a template (trimming name/description) and reads it back", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "  Camping  ",
      description: "  weekend kit  ",
      items: [{ name: "Tent", category: " Gear " }],
    });
    const template = await alice.query(api.templates.get, { templateId: id });
    expect(template.name).toBe("Camping");
    expect(template.description).toBe("weekend kit");
    // Item category names are trimmed and recorded as suggestions.
    expect(template.items).toEqual([{ name: "Tent", category: "Gear" }]);
    const suggestions = await alice.query(api.categories.listByProject, {
      projectId: ids.family,
    });
    expect(suggestions.map((c) => c.name)).toContain("Gear");
  });

  // Transitional (drop with listItems.categoryId): pre-rework clients send
  // category *ids* in template items — same-project ids resolve to their name
  // at save time, foreign ones degrade to "no category".
  it("resolves legacy category ids in items at save time", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Legacy",
      items: [
        { name: "Milk", category: ids.groceries },
        { name: "Sunscreen", category: ids.foreign }, // another project
      ],
    });
    const template = await alice.query(api.templates.get, { templateId: id });
    expect(template.items).toEqual([
      { name: "Milk", category: "Groceries" },
      { name: "Sunscreen", category: null },
    ]);
  });

  it("drops a blank description to undefined", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Bare",
      description: "   ",
      items: [],
    });
    const template = await alice.query(api.templates.get, { templateId: id });
    expect(template.description).toBeUndefined();
  });

  it("rejects an empty name", async () => {
    await expect(
      alice.mutation(api.templates.create, {
        projectId: ids.family,
        name: "   ",
        items: [],
      }),
    ).rejects.toThrow("Template name is required");
  });

  it("updates name, description and items", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Old",
      items: [],
    });
    await alice.mutation(api.templates.update, {
      templateId: id,
      name: "New",
      description: "desc",
      items: [
        { name: "Milk", category: "Groceries" },
        { name: "Eggs", category: null },
      ],
    });
    const template = await alice.query(api.templates.get, { templateId: id });
    expect(template.name).toBe("New");
    expect(template.description).toBe("desc");
    expect(template.items).toHaveLength(2);
  });

  it("orders the listing by updatedAt desc", async () => {
    await t.run(async (ctx) => {
      await ctx.db.insert("listTemplates", {
        name: "Older",
        items: [],
        projectId: ids.family,
        createdBy: ids.alice,
        updatedAt: Date.parse("2024-01-01"),
      });
      await ctx.db.insert("listTemplates", {
        name: "Newer",
        items: [],
        projectId: ids.family,
        createdBy: ids.alice,
        updatedAt: Date.parse("2024-06-01"),
      });
    });
    const templates = await alice.query(api.templates.listByProject, {
      projectId: ids.family,
    });
    expect(templates.map((tpl) => tpl.name)).toEqual(["Newer", "Older"]);
  });

  it("deletes a template", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Doomed",
      items: [],
    });
    await alice.mutation(api.templates.remove, { templateId: id });
    await expect(
      alice.query(api.templates.get, { templateId: id }),
    ).rejects.toThrow("Template not found");
  });

  it("rejects non-members (opaque not-found)", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Secret",
      items: [],
    });
    await expect(
      bob.query(api.templates.get, { templateId: id }),
    ).rejects.toThrow();
    await expect(
      bob.query(api.templates.listByProject, { projectId: ids.family }),
    ).rejects.toThrow();
  });
});

describe("templates: export", () => {
  it("copies a template into another project the user belongs to", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Starter",
      description: "kit",
      items: [
        { name: "Milk", category: "Groceries" },
        { name: "Eggs", category: null },
      ],
    });
    const copyId = await alice.mutation(api.templates.exportToProject, {
      templateId: id,
      targetProjectId: ids.shared,
    });

    const copy = await alice.query(api.templates.get, { templateId: copyId });
    expect(copy._id).not.toBe(id);
    expect(copy.projectId).toBe(ids.shared);
    expect(copy.name).toBe("Starter");
    expect(copy.description).toBe("kit");
    // Category names copy losslessly across projects…
    expect(copy.items).toEqual([
      { name: "Milk", category: "Groceries" },
      { name: "Eggs", category: null },
    ]);
    // …and are recorded as suggestions in the target project.
    const suggestions = await alice.query(api.categories.listByProject, {
      projectId: ids.shared,
    });
    expect(suggestions.map((c) => c.name)).toEqual(["Groceries"]);

    // The source template is untouched.
    const original = await alice.query(api.templates.listByProject, {
      projectId: ids.family,
    });
    expect(original).toHaveLength(1);
  });

  it("rejects exporting into a project the user is not a member of", async () => {
    const id = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Starter",
      items: [],
    });
    await expect(
      alice.mutation(api.templates.exportToProject, {
        templateId: id,
        targetProjectId: ids.other,
      }),
    ).rejects.toThrow("Project not found");
  });
});

describe("lists: import templates into an existing list", () => {
  it("appends template items, copying category names", async () => {
    const list = await t.run((ctx) =>
      ctx.db.insert("lists", {
        name: "Trip",
        description: "",
        projectId: ids.family,
        favorite: false,
        createdBy: ids.alice,
        updatedAt: Date.now(),
      }),
    );
    await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Existing",
    });
    const tpl = await alice.mutation(api.templates.create, {
      projectId: ids.family,
      name: "Pack",
      items: [
        { name: "Milk", category: "Groceries" },
        { name: "Eggs", category: null },
        { name: "Sunscreen", category: "Beach" },
      ],
    });

    await alice.mutation(api.lists.importTemplates, {
      listId: list,
      templateIds: [tpl],
    });

    const result = await alice.query(api.lists.get, { listId: list });
    expect(result).not.toBeNull();
    const byName = Object.fromEntries(
      result!.items.map((item) => [item.name, item.category ?? null]),
    );
    expect(byName).toEqual({
      Existing: null,
      Milk: "Groceries",
      Eggs: null,
      Sunscreen: "Beach",
    });
  });

  it("rejects importing into a list of a project the user can't access", async () => {
    const list = await t.run((ctx) =>
      ctx.db.insert("lists", {
        name: "Theirs",
        description: "",
        projectId: ids.other,
        favorite: false,
        createdBy: ids.bob,
        updatedAt: Date.now(),
      }),
    );
    const tpl = await bob.mutation(api.templates.create, {
      projectId: ids.other,
      name: "Pack",
      items: [{ name: "X", category: null }],
    });
    await expect(
      alice.mutation(api.lists.importTemplates, {
        listId: list,
        templateIds: [tpl],
      }),
    ).rejects.toThrow();
  });
});

describe("categories: deprecated create", () => {
  // Transitional (drop with listItems.categoryId): pre-rework pickers create
  // categories explicitly; now it's just a suggestion upsert deduped by name.
  it("dedupes by exact name and returns the existing suggestion's id", async () => {
    const drinks = await alice.mutation(api.categories.create, {
      projectId: ids.family,
      name: " Drinks ",
    });
    const again = await alice.mutation(api.categories.create, {
      projectId: ids.family,
      name: "Drinks",
    });
    expect(again).toBe(drinks);
    const suggestions = await alice.query(api.categories.listByProject, {
      projectId: ids.family,
    });
    expect(suggestions.map((c) => c.name)).toEqual(["Drinks", "Groceries"]);
  });
});
