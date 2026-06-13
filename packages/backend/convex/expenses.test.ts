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
};

function setup() {
  return convexTest(schema, modules);
}

// Family has two members so pots (which need at least two) are creatable.
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
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: family, userId: bob });
    return { alice, bob, family };
  });
}

let t: ReturnType<typeof setup>;
let ids: Ids;
let alice: ReturnType<ReturnType<typeof setup>["withIdentity"]>;

beforeEach(async () => {
  t = setup();
  ids = await seed(t);
  alice = t.withIdentity({ subject: `${ids.alice}|session` });
});

async function makePot(name = "Trip") {
  return alice.mutation(api.expenses.createPot, {
    projectId: ids.family,
    name,
    memberIds: [ids.alice, ids.bob],
  });
}

async function potMembers(potId: Id<"pots">) {
  return t.run((ctx) =>
    ctx.db
      .query("potMembers")
      .withIndex("by_pot", (q) => q.eq("potId", potId))
      .collect(),
  );
}

async function potSpendings(potId: Id<"pots">) {
  return t.run((ctx) =>
    ctx.db
      .query("spendings")
      .withIndex("by_pot", (q) => q.eq("potId", potId))
      .collect(),
  );
}

describe("expenses: deletePot", () => {
  it("deletes a not-yet-started pot and cascades its members", async () => {
    const potId = await makePot();
    await alice.mutation(api.expenses.deletePot, { potId });

    await expect(alice.query(api.expenses.getPot, { potId })).rejects.toThrow(
      "Pot not found",
    );
    expect(await potMembers(potId)).toHaveLength(0);
  });

  it("refuses to delete an in-progress pot", async () => {
    const potId = await makePot();
    await alice.mutation(api.expenses.createSpending, {
      potId,
      amount: 1000,
      from: ids.alice,
    });

    await expect(
      alice.mutation(api.expenses.deletePot, { potId }),
    ).rejects.toThrow("settled or not-yet-started");
    // The pot and its spending survive the rejected delete.
    expect((await alice.query(api.expenses.getPot, { potId })).name).toBe(
      "Trip",
    );
    expect(await potSpendings(potId)).toHaveLength(1);
  });

  it("deletes a settled pot and cascades its settle-up spendings", async () => {
    const potId = await makePot();
    // Alice pays 10€ split equally, so Bob owes her 5€.
    await alice.mutation(api.expenses.createSpending, {
      potId,
      amount: 1000,
      from: ids.alice,
    });
    const pot = await alice.query(api.expenses.getPot, { potId });
    expect(pot.settlements.length).toBeGreaterThan(0);
    await alice.mutation(api.expenses.settlePayments, {
      potId,
      payments: pot.settlements.map((s) => ({
        from: s.from,
        to: s.to,
        amount: s.amount,
      })),
    });

    // Now settled — deletion is allowed and removes every spending row.
    await alice.mutation(api.expenses.deletePot, { potId });
    await expect(alice.query(api.expenses.getPot, { potId })).rejects.toThrow(
      "Pot not found",
    );
    expect(await potSpendings(potId)).toHaveLength(0);
  });

  it("rejects a non-member", async () => {
    const potId = await makePot();
    const carolId = await t.run((ctx) =>
      ctx.db.insert("users", { name: "Carol", email: "carol@example.test" }),
    );
    const carol = t.withIdentity({ subject: `${carolId}|session` });
    await expect(
      carol.mutation(api.expenses.deletePot, { potId }),
    ).rejects.toThrow();
  });
});
