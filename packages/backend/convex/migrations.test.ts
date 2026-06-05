import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const SECRET = "test-migration-secret";

function setup() {
  return convexTest(schema, modules);
}

let t: ReturnType<typeof setup>;
let projectId: Id<"projects">;
let alice: Id<"users">;
let bob: Id<"users">;

beforeEach(async () => {
  vi.stubEnv("MIGRATION_SECRET", SECRET);
  t = setup();
  const seeded = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", {
      name: "Alice",
      email: "alice@example.test",
    });
    const bob = await ctx.db.insert("users", {
      name: "Bob",
      email: "bob@example.test",
    });
    const projectId = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "tok",
      color: "blue",
    });
    return { alice, bob, projectId };
  });
  alice = seeded.alice;
  bob = seeded.bob;
  projectId = seeded.projectId;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("secret gate", () => {
  it("rejects a wrong or missing secret", async () => {
    await expect(
      t.mutation(api.migrations.upsertNote, {
        secret: "wrong",
        legacyId: "n1",
        name: "Note",
        contents: "",
        format: "plain",
        projectId,
        createdBy: alice,
        updatedAt: 1,
      }),
    ).rejects.toThrow(/migration secret/i);
  });
});

describe("upsertUser", () => {
  it("normalizes the email and sets the verification time", async () => {
    const id = await t.mutation(api.migrations.upsertUser, {
      secret: SECRET,
      legacyId: "u1",
      email: "Mixed.Case@Example.COM",
      emailVerificationTime: 1700000000000,
    });
    const user = await t.run((ctx) => ctx.db.get(id));
    expect(user?.email).toBe("mixed.case@example.com");
    // Required for Convex Auth to link the migrated row on first sign-in.
    expect(user?.emailVerificationTime).toBe(1700000000000);
  });

  it("is idempotent by legacyId (patches instead of duplicating)", async () => {
    const first = await t.mutation(api.migrations.upsertUser, {
      secret: SECRET,
      legacyId: "u1",
      email: "u1@example.test",
      emailVerificationTime: 1,
      name: "Old",
    });
    const second = await t.mutation(api.migrations.upsertUser, {
      secret: SECRET,
      legacyId: "u1",
      email: "u1@example.test",
      emailVerificationTime: 1,
      name: "New",
    });
    expect(second).toBe(first);
    const rows = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", "u1"))
        .collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("New");
  });
});

describe("upsertNote", () => {
  it("inserts then patches on re-run, keeping a single row", async () => {
    const first = await t.mutation(api.migrations.upsertNote, {
      secret: SECRET,
      legacyId: "note1",
      name: "Groceries",
      contents: "<p>milk</p>",
      format: "html",
      projectId,
      createdBy: alice,
      updatedAt: 42,
    });
    const second = await t.mutation(api.migrations.upsertNote, {
      secret: SECRET,
      legacyId: "note1",
      name: "Groceries (edited)",
      contents: "<p>milk, eggs</p>",
      format: "html",
      projectId,
      createdBy: alice,
      updatedAt: 99,
    });
    expect(second).toBe(first);
    const notes = await t.run((ctx) =>
      ctx.db
        .query("notes")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect(),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      name: "Groceries (edited)",
      contents: "<p>milk, eggs</p>",
      format: "html",
      updatedAt: 99,
    });
  });
});

describe("expenses (pots, members, spendings)", () => {
  it("migrates a pot with members, spendings, and source timestamps", async () => {
    const potId = await t.mutation(api.migrations.upsertPot, {
      secret: SECRET,
      legacyId: "pot1",
      name: "Trip",
      projectId,
      createdAt: 1000,
      createdBy: alice,
    });
    await t.mutation(api.migrations.addPotMember, {
      secret: SECRET,
      potId,
      userId: alice,
    });
    await t.mutation(api.migrations.addPotMember, {
      secret: SECRET,
      potId,
      userId: bob,
    });
    const spendingId = await t.mutation(api.migrations.upsertSpending, {
      secret: SECRET,
      legacyId: "sp1",
      amount: 1500,
      currency: "EUR",
      description: "Dinner",
      from: alice,
      projectId,
      potId,
      createdAt: 2000,
      createdBy: alice,
    });

    const { pot, members, spending } = await t.run(async (ctx) => {
      const pot = await ctx.db.get(potId);
      const members = await ctx.db
        .query("potMembers")
        .withIndex("by_pot", (q) => q.eq("potId", potId))
        .collect();
      const spending = await ctx.db.get(spendingId);
      return { pot, members, spending };
    });

    expect(pot?.createdAt).toBe(1000);
    expect(members).toHaveLength(2);
    expect(spending).toMatchObject({
      amount: 1500,
      currency: "EUR",
      from: alice,
      potId,
      createdAt: 2000,
    });
  });

  it("does not duplicate members or pots on re-run", async () => {
    const run = async () => {
      const potId = await t.mutation(api.migrations.upsertPot, {
        secret: SECRET,
        legacyId: "pot1",
        name: "Trip",
        projectId,
        createdAt: 1000,
        createdBy: alice,
      });
      await t.mutation(api.migrations.addPotMember, {
        secret: SECRET,
        potId,
        userId: alice,
      });
      return potId;
    };
    const firstPot = await run();
    const secondPot = await run();
    expect(secondPot).toBe(firstPot);

    const { pots, members } = await t.run(async (ctx) => {
      const pots = await ctx.db
        .query("pots")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", "pot1"))
        .collect();
      const members = await ctx.db
        .query("potMembers")
        .withIndex("by_pot", (q) => q.eq("potId", firstPot))
        .collect();
      return { pots, members };
    });
    expect(pots).toHaveLength(1);
    expect(members).toHaveLength(1);
  });
});
