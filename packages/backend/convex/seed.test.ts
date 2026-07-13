import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

const REVIEW_EMAIL = "review@suro.clotet.dev";

async function setupUser(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", { email: REVIEW_EMAIL, locale: "ca" });
  });
}

describe("seed:demoGroup", () => {
  it("requires the review user to exist", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.seed.demoGroup, {
        email: REVIEW_EMAIL,
        locale: "ca",
      }),
    ).rejects.toThrow(/sign in once/);
  });

  it("stages a localized demo group and switches the user's locale", async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    const { projectId } = await t.mutation(internal.seed.demoGroup, {
      email: REVIEW_EMAIL,
      locale: "en",
    });

    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      expect(project?.name).toBe("Gràcia flat");
      const user = await ctx.db.get(userId);
      expect(user?.locale).toBe("en");
      expect(user?.name).toBe("Anna");

      const members = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      expect(members).toHaveLength(3);

      const lists = await ctx.db
        .query("lists")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      expect(lists).toHaveLength(3);
      // The packing list is linked to the trip event.
      expect(lists.filter((list) => list.eventId !== undefined)).toHaveLength(
        1,
      );

      const events = await ctx.db
        .query("events")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      expect(events).toHaveLength(4);

      const notes = await ctx.db
        .query("notes")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      expect(notes).toHaveLength(2);

      const spendings = await ctx.db
        .query("spendings")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      expect(spendings).toHaveLength(3);
    });
  });

  it("stages assigned tasks and a today event for the home dashboard", async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    const { projectId } = await t.mutation(internal.seed.demoGroup, {
      email: REVIEW_EMAIL,
      locale: "ca",
    });

    await t.run(async (ctx) => {
      const chores = await ctx.db
        .query("lists")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      const choreList = chores.find((list) => list.name === "Tasques de casa");
      expect(choreList?.taskMode).toBe(true);

      const assigned = await ctx.db
        .query("listItems")
        .withIndex("by_list", (q) => q.eq("listId", choreList!._id))
        .collect();
      const annaTasks = assigned.filter(
        (item) => item.assigneeId === userId && !item.completed,
      );
      expect(annaTasks).toHaveLength(3);

      const events = await ctx.db
        .query("events")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      expect(events.some((event) => event.name === "Sopar al terrat")).toBe(
        true,
      );
    });
  });

  it("rebuilds (not duplicates) the demo group when re-run in another locale", async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    await t.mutation(internal.seed.demoGroup, {
      email: REVIEW_EMAIL,
      locale: "ca",
    });
    await t.mutation(internal.seed.demoGroup, {
      email: REVIEW_EMAIL,
      locale: "es",
    });

    await t.run(async (ctx) => {
      const owned = await ctx.db
        .query("projects")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
        .collect();
      expect(owned.map((project) => project.name)).toEqual([
        "El piso de Gracia",
      ]);
      // Fake members are reused across runs, not duplicated.
      const julias = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", "julia@suro.demo"))
        .collect();
      expect(julias).toHaveLength(1);
    });
  });
});
