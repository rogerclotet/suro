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

describe("administrator group management", () => {
  it("lets the administrator remove a member and revokes group access", async () => {
    const { t, alice, bob, family } = await seedInvite();
    await t.run((ctx) =>
      ctx.db.insert("projectMembers", { projectId: family, userId: bob }),
    );
    const admin = t.withIdentity({ subject: `${alice}|session` });
    await admin.mutation(api.projects.removeMember, {
      projectId: family,
      userId: bob,
    });
    expect((await members(t, family)).map((m) => m.userId)).toEqual([alice]);
    await expect(
      t
        .withIdentity({ subject: `${bob}|session` })
        .query(api.projects.get, { projectId: family }),
    ).rejects.toThrow(/not found/i);
  });

  it("rejects a mismatched confirmation name without deleting anything", async () => {
    const { t, alice, family } = await seedInvite();
    const admin = t.withIdentity({ subject: `${alice}|session` });
    for (const confirmationName of ["", "family", "Family ", "Famil"]) {
      await expect(
        admin.mutation(api.projects.remove, {
          projectId: family,
          confirmationName,
        }),
      ).rejects.toThrow(/name/i);
      expect(await t.run((ctx) => ctx.db.get(family))).not.toBeNull();
    }
  });

  it("lets the administrator delete a populated group with its full name", async () => {
    const { t, alice, bob, family } = await seedInvite();
    await t.run((ctx) =>
      ctx.db.insert("projectMembers", { projectId: family, userId: bob }),
    );
    await t
      .withIdentity({ subject: `${alice}|session` })
      .mutation(api.projects.remove, {
        projectId: family,
        confirmationName: "Family",
      });
    expect(await t.run((ctx) => ctx.db.get(family))).toBeNull();
    expect(await members(t, family)).toEqual([]);
  });
});

async function seedManagedGroup() {
  const fixture = await seedInvite();
  const { t, alice, bob, family } = fixture;
  const data = await t.run(async (ctx) => {
    await ctx.db.insert("projectMembers", { projectId: family, userId: bob });
    const outsider = await ctx.db.insert("users", { name: "Outsider" });
    const otherGroup = await ctx.db.insert("projects", {
      name: "Other",
      createdBy: bob,
      inviteToken: "other",
      color: "blue",
    });
    await ctx.db.insert("projectMembers", {
      projectId: otherGroup,
      userId: bob,
    });
    const list = await ctx.db.insert("lists", {
      name: "Tasks",
      projectId: family,
      createdBy: bob,
      updatedAt: 1,
      favorite: false,
    });
    const item = await ctx.db.insert("listItems", {
      name: "Task",
      listId: list,
      createdBy: bob,
      updatedAt: 1,
      completed: false,
      assigneeId: bob,
    });
    const pot = await ctx.db.insert("pots", {
      name: "Expenses",
      projectId: family,
      createdBy: bob,
    });
    const potMember = await ctx.db.insert("potMembers", {
      potId: pot,
      userId: bob,
    });
    const spending = await ctx.db.insert("spendings", {
      projectId: family,
      potId: pot,
      createdBy: bob,
      from: bob,
      amount: 1000,
      currency: "EUR",
    });
    const receipt = await ctx.db.insert("notifications", {
      userId: bob,
      projectId: family,
      section: "members",
      target: { kind: "members" },
    });
    const otherReceipt = await ctx.db.insert("notifications", {
      userId: bob,
      projectId: otherGroup,
      section: "members",
      target: { kind: "members" },
    });
    const adminReceipt = await ctx.db.insert("notifications", {
      userId: alice,
      projectId: family,
      section: "members",
      target: { kind: "members" },
    });
    return {
      outsider,
      otherGroup,
      list,
      item,
      pot,
      potMember,
      spending,
      receipt,
      otherReceipt,
      adminReceipt,
    };
  });
  return { ...fixture, ...data };
}

describe("group management permissions and cleanup", () => {
  it("rejects both member removal and deletion by non-admins, outsiders and signed-out callers", async () => {
    const { t, bob, outsider, family } = await seedManagedGroup();
    for (const caller of [
      t,
      t.withIdentity({ subject: `${bob}|session` }),
      t.withIdentity({ subject: `${outsider}|session` }),
    ]) {
      await expect(
        caller.mutation(api.projects.removeMember, {
          projectId: family,
          userId: bob,
        }),
      ).rejects.toThrow();
      await expect(
        caller.mutation(api.projects.remove, {
          projectId: family,
          confirmationName: "Family",
        }),
      ).rejects.toThrow();
    }
    expect(await members(t, family)).toHaveLength(2);
    expect(await t.run((ctx) => ctx.db.get(family))).not.toBeNull();
  });

  it("protects the administrator and rejects a target outside the group", async () => {
    const { t, alice, outsider, family } = await seedManagedGroup();
    const admin = t.withIdentity({ subject: `${alice}|session` });
    await expect(
      admin.mutation(api.projects.removeMember, {
        projectId: family,
        userId: alice,
      }),
    ).rejects.toThrow(/administrator cannot be removed/i);
    await expect(
      admin.mutation(api.projects.removeMember, {
        projectId: family,
        userId: outsider,
      }),
    ).rejects.toThrow(/not a member/i);
    expect(await members(t, family)).toHaveLength(2);
  });

  it("preserves a removed member's shared work and expense splits, but clears their group receipts", async () => {
    const f = await seedManagedGroup();
    await f.t
      .withIdentity({ subject: `${f.alice}|session` })
      .mutation(api.projects.removeMember, {
        projectId: f.family,
        userId: f.bob,
      });
    await f.t.run(async (ctx) => {
      expect(await ctx.db.get(f.receipt)).toBeNull();
      for (const id of [
        f.list,
        f.item,
        f.pot,
        f.potMember,
        f.spending,
        f.otherGroup,
        f.otherReceipt,
        f.adminReceipt,
        f.bob,
      ])
        expect(await ctx.db.get(id)).not.toBeNull();
    });
    const removed = f.t.withIdentity({ subject: `${f.bob}|session` });
    expect(
      (await removed.query(api.projects.listMine, {})).map((p) => p._id),
    ).toEqual([f.otherGroup]);
    await expect(
      removed.query(api.expenses.getPot, { potId: f.pot }),
    ).rejects.toThrow(/not found/i);
  });

  it("deletes all group data and stored images without affecting other groups or user accounts", async () => {
    const f = await seedManagedGroup();
    const { image, file, thumbnail } = await f.t.run(async (ctx) => {
      const image = await ctx.storage.store(new Blob(["group"]));
      const file = await ctx.storage.store(new Blob(["file"]));
      const thumbnail = await ctx.storage.store(new Blob(["thumbnail"]));
      await ctx.db.patch(f.family, { imageStorageId: image });
      await ctx.db.insert("files", {
        name: "File",
        storageId: file,
        thumbnailStorageId: thumbnail,
        type: "image/png",
        size: 4,
        projectId: f.family,
        uploadedBy: f.bob,
      });
      await ctx.db.insert("events", {
        name: "Event",
        projectId: f.family,
        createdBy: f.bob,
        startAt: 1,
        endAt: 2,
        allDay: false,
        updatedAt: 1,
      });
      await ctx.db.insert("notes", {
        name: "Note",
        contents: "Text",
        format: "plain",
        projectId: f.family,
        createdBy: f.bob,
        updatedAt: 1,
      });
      await ctx.db.insert("categories", {
        name: "Category",
        projectId: f.family,
      });
      await ctx.db.insert("listTemplates", {
        name: "Template",
        items: [],
        projectId: f.family,
        createdBy: f.bob,
        updatedAt: 1,
      });
      return { image, file, thumbnail };
    });
    await f.t
      .withIdentity({ subject: `${f.alice}|session` })
      .mutation(api.projects.remove, {
        projectId: f.family,
        confirmationName: "Family",
      });
    await f.t.run(async (ctx) => {
      for (const table of [
        "lists",
        "pots",
        "files",
        "events",
        "notes",
        "categories",
        "listTemplates",
        "projectMembers",
        "notifications",
        "spendings",
      ] as const) {
        expect(
          await ctx.db
            .query(table)
            .withIndex("by_project", (q) => q.eq("projectId", f.family))
            .collect(),
        ).toEqual([]);
      }
      expect(await ctx.db.get(f.family)).toBeNull();
      expect(await ctx.db.get(f.item)).toBeNull();
      expect(await ctx.db.get(f.potMember)).toBeNull();
      for (const id of [image, file, thumbnail])
        expect(await ctx.storage.get(id)).toBeNull();
      for (const id of [f.otherGroup, f.otherReceipt, f.alice, f.bob])
        expect(await ctx.db.get(id)).not.toBeNull();
    });
  });

  it("rejects a stale name if the group is renamed while the dialog is open", async () => {
    const { t, alice, family } = await seedInvite();
    const admin = t.withIdentity({ subject: `${alice}|session` });
    await admin.mutation(api.projects.update, {
      projectId: family,
      name: "New name",
    });
    await expect(
      admin.mutation(api.projects.remove, {
        projectId: family,
        confirmationName: "Family",
      }),
    ).rejects.toThrow(/name does not match/i);
    expect(await t.run((ctx) => ctx.db.get(family))).not.toBeNull();
  });
});
