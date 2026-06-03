import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

describe("projects.listMine", () => {
  it("returns only the projects the caller belongs to", async () => {
    const t = convexTest(schema, modules);
    const { alice, family } = await t.run(async (ctx) => {
      const alice = await ctx.db.insert("users", { email: "a@x.test" });
      const bob = await ctx.db.insert("users", { email: "b@x.test" });
      const family = await ctx.db.insert("projects", {
        name: "Family",
        createdBy: alice,
        inviteToken: "t1",
        color: "blue",
        features: { secretSanta: false },
      });
      const solo = await ctx.db.insert("projects", {
        name: "Bob solo",
        createdBy: bob,
        inviteToken: "t2",
        color: "red",
        features: { secretSanta: false },
      });
      await ctx.db.insert("projectMembers", {
        projectId: family,
        userId: alice,
      });
      await ctx.db.insert("projectMembers", { projectId: solo, userId: bob });
      return { alice, family };
    });

    const asAlice = t.withIdentity({ subject: `${alice}|session` });
    const projects = await asAlice.query(api.projects.listMine, {});
    expect(projects.map((p) => p.name)).toEqual(["Family"]);
    expect(projects.map((p) => p._id)).toEqual([family]);
  });

  it("requires authentication", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.projects.listMine, {})).rejects.toThrow();
  });
});
