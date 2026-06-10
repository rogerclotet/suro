import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

/** A project owned by Alice (member) with Bob as a non-member outsider. */
async function seedInvite() {
  const t = convexTest(schema, modules);
  const { alice, bob, family } = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { email: "a@x.test" });
    const bob = await ctx.db.insert("users", { email: "b@x.test" });
    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "secret-token",
      color: "blue",
    });
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    return { alice, bob, family };
  });
  return { t, alice, bob, family };
}

function members(
  t: Awaited<ReturnType<typeof seedInvite>>["t"],
  family: Id<"projects">,
) {
  return t.run((ctx) =>
    ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", family))
      .collect(),
  );
}

describe("projects.create", () => {
  it("creates a group, trims the name, and adds the caller as a member", async () => {
    const t = convexTest(schema, modules);
    const alice = await t.run((ctx) =>
      ctx.db.insert("users", { email: "a@x.test" }),
    );
    const asAlice = t.withIdentity({ subject: `${alice}|session` });

    const projectId = await asAlice.mutation(api.projects.create, {
      name: "  Trips  ",
    });

    const project = await t.run((ctx) => ctx.db.get(projectId));
    expect(project?.name).toBe("Trips");
    expect(project?.createdBy).toBe(alice);
    expect(project?.inviteToken).toBeTruthy();
    expect(await members(t, projectId)).toHaveLength(1);
  });

  it("rejects an empty name", async () => {
    const t = convexTest(schema, modules);
    const alice = await t.run((ctx) =>
      ctx.db.insert("users", { email: "a@x.test" }),
    );
    const asAlice = t.withIdentity({ subject: `${alice}|session` });
    await expect(
      asAlice.mutation(api.projects.create, { name: "   " }),
    ).rejects.toThrow(/name is required/i);
  });

  it("requires authentication", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.projects.create, { name: "Trips" }),
    ).rejects.toThrow();
  });
});

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
      });
      const solo = await ctx.db.insert("projects", {
        name: "Bob solo",
        createdBy: bob,
        inviteToken: "t2",
        color: "red",
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

describe("projects.acceptInvite", () => {
  it("adds the caller with a valid token and is idempotent", async () => {
    const { t, bob, family } = await seedInvite();
    const asBob = t.withIdentity({ subject: `${bob}|session` });
    const first = await asBob.mutation(api.projects.acceptInvite, {
      projectId: family,
      inviteToken: "secret-token",
    });
    expect(first).toEqual({ projectId: family });
    // Joining again is a no-op, not a duplicate membership.
    await asBob.mutation(api.projects.acceptInvite, {
      projectId: family,
      inviteToken: "secret-token",
    });
    const rows = await members(t, family);
    expect(rows.filter((m) => m.userId === bob)).toHaveLength(1);
  });

  it("rejects a wrong token", async () => {
    const { t, bob, family } = await seedInvite();
    const asBob = t.withIdentity({ subject: `${bob}|session` });
    await expect(
      asBob.mutation(api.projects.acceptInvite, {
        projectId: family,
        inviteToken: "nope",
      }),
    ).rejects.toThrow(/invalid invite token/i);
    expect((await members(t, family)).some((m) => m.userId === bob)).toBe(
      false,
    );
  });

  it("rejects an expired token", async () => {
    const { t, bob, family } = await seedInvite();
    await t.run((ctx) => ctx.db.patch(family, { inviteTokenExpiresAt: 1 }));
    const asBob = t.withIdentity({ subject: `${bob}|session` });
    await expect(
      asBob.mutation(api.projects.acceptInvite, {
        projectId: family,
        inviteToken: "secret-token",
      }),
    ).rejects.toThrow(/expired/i);
  });
});

describe("projects.getByInvite", () => {
  it("previews the group for a valid token, null for a bad one", async () => {
    const { t, bob, family } = await seedInvite();
    const asBob = t.withIdentity({ subject: `${bob}|session` });
    const preview = await asBob.query(api.projects.getByInvite, {
      projectId: family,
      inviteToken: "secret-token",
    });
    expect(preview).toMatchObject({ _id: family, name: "Family" });
    expect(preview?.members).toHaveLength(1); // Alice
    const bad = await asBob.query(api.projects.getByInvite, {
      projectId: family,
      inviteToken: "wrong",
    });
    expect(bad).toBeNull();
  });
});

describe("projects.update", () => {
  it("lets the creator change name and color", async () => {
    const { t, alice, family } = await seedInvite();
    const asAlice = t.withIdentity({ subject: `${alice}|session` });
    await asAlice.mutation(api.projects.update, {
      projectId: family,
      name: "  Casa  ",
      color: "green",
    });
    const project = await t.run((ctx) => ctx.db.get(family));
    expect(project).toMatchObject({ name: "Casa", color: "green" });
  });

  it("ignores an unknown color and rejects an empty name", async () => {
    const { t, alice, family } = await seedInvite();
    const asAlice = t.withIdentity({ subject: `${alice}|session` });
    await asAlice.mutation(api.projects.update, {
      projectId: family,
      color: "not-a-color",
    });
    expect(await t.run((ctx) => ctx.db.get(family))).toMatchObject({
      color: "blue",
    });
    await expect(
      asAlice.mutation(api.projects.update, { projectId: family, name: "   " }),
    ).rejects.toThrow(/name is required/i);
  });

  it("forbids a non-creator from editing", async () => {
    const { t, bob, family } = await seedInvite();
    await t.run((ctx) =>
      ctx.db.insert("projectMembers", { projectId: family, userId: bob }),
    );
    const asBob = t.withIdentity({ subject: `${bob}|session` });
    await expect(
      asBob.mutation(api.projects.update, {
        projectId: family,
        name: "Hijack",
      }),
    ).rejects.toThrow(/only the creator/i);
  });
});

describe("projects.leave", () => {
  it("removes only the caller's own membership", async () => {
    const { t, alice, bob, family } = await seedInvite();
    await t.run((ctx) =>
      ctx.db.insert("projectMembers", { projectId: family, userId: bob }),
    );
    const asBob = t.withIdentity({ subject: `${bob}|session` });
    await asBob.mutation(api.projects.leave, { projectId: family });
    expect((await members(t, family)).map((m) => m.userId)).toEqual([alice]);
  });

  it("forbids the creator from leaving", async () => {
    const { t, alice, family } = await seedInvite();
    const asAlice = t.withIdentity({ subject: `${alice}|session` });
    await expect(
      asAlice.mutation(api.projects.leave, { projectId: family }),
    ).rejects.toThrow(/creator cannot leave/i);
  });

  it("rejects a non-member", async () => {
    const { t, bob, family } = await seedInvite();
    const asBob = t.withIdentity({ subject: `${bob}|session` });
    await expect(
      asBob.mutation(api.projects.leave, { projectId: family }),
    ).rejects.toThrow(/not a member/i);
  });
});
