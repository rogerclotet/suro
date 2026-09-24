import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

/** Narrow a detail-query result the test just created: `getPot` now returns
 * null for a missing pot, so field access needs the non-null guarantee the
 * test already relies on. */
function present<T>(value: T | null): T {
  if (value === null) {
    throw new Error("expected the document to exist");
  }
  return value;
}

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

    // A deleted pot reads back as null (not an error) so the detail screen can
    // navigate away cleanly instead of surfacing a server error.
    expect(await alice.query(api.expenses.getPot, { potId })).toBeNull();
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
    expect(
      present(await alice.query(api.expenses.getPot, { potId })).name,
    ).toBe("Trip");
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
    const pot = present(await alice.query(api.expenses.getPot, { potId }));
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
    expect(await alice.query(api.expenses.getPot, { potId })).toBeNull();
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

describe("expenses: listPotsOverview totalSpent", () => {
  it("sums split spendings but excludes settle-up transfers", async () => {
    const potId = await makePot();
    // Alice pays 30€ split equally, so Bob owes her 15€.
    await alice.mutation(api.expenses.createSpending, {
      potId,
      amount: 3000,
      from: ids.alice,
    });
    const pot = present(await alice.query(api.expenses.getPot, { potId }));
    await alice.mutation(api.expenses.settlePayments, {
      potId,
      payments: pot.settlements.map((s) => ({
        from: s.from,
        to: s.to,
        amount: s.amount,
      })),
    });

    const overview = await alice.query(api.expenses.listPotsOverview, {
      projectId: ids.family,
      settledLimit: 5,
    });
    const [settledPot] = overview.settled;
    // Total spent stays 30€: the 15€ settle-up transfer isn't new spend.
    expect(settledPot?.totalSpent).toBe(3000);
  });
});

describe("expenses: solo groups", () => {
  async function seedSolo() {
    return t.run(async (ctx) => {
      const alice = await ctx.db.insert("users", {
        name: "Alice",
        email: "alice-solo@example.test",
      });
      const solo = await ctx.db.insert("projects", {
        name: "Personal",
        createdBy: alice,
        inviteToken: "token-solo",
        color: "blue",
      });
      await ctx.db.insert("projectMembers", {
        projectId: solo,
        userId: alice,
      });
      return { alice, solo };
    });
  }

  it("creates an implicit solo pot and records spendings", async () => {
    const { alice: aliceId, solo } = await seedSolo();
    const soloAlice = t.withIdentity({ subject: `${aliceId}|session` });

    const potId = await soloAlice.mutation(api.expenses.ensureSoloPot, {
      projectId: solo,
    });
    const overview = await soloAlice.query(api.expenses.getSoloExpenses, {
      projectId: solo,
    });
    expect(overview?.potId).toBe(potId);

    await soloAlice.mutation(api.expenses.createSpending, {
      potId,
      amount: 2500,
      from: aliceId,
      description: "Groceries",
    });

    const after = await soloAlice.query(api.expenses.getSoloExpenses, {
      projectId: solo,
    });
    expect(after?.spendings).toHaveLength(1);
    expect(after?.spendings[0]?.amount).toBe(2500);
    expect(after?.spendings[0]?.description).toBe("Groceries");
  });

  it("returns null for multi-member groups", async () => {
    const result = await alice.query(api.expenses.getSoloExpenses, {
      projectId: ids.family,
    });
    expect(result).toBeNull();
  });

  it("allows a one-member pot only in solo groups", async () => {
    const { alice: aliceId, solo } = await seedSolo();
    const soloAlice = t.withIdentity({ subject: `${aliceId}|session` });

    const potId = await soloAlice.mutation(api.expenses.createPot, {
      projectId: solo,
      name: "Personal",
      memberIds: [aliceId],
    });
    expect(await potMembers(potId)).toHaveLength(1);

    await expect(
      alice.mutation(api.expenses.createPot, {
        projectId: ids.family,
        name: "Invalid",
        memberIds: [ids.alice],
      }),
    ).rejects.toThrow("at least two members");
  });
});

it("deduplicates an expense retried after a lost acknowledgement", async () => {
  const potId = await makePot();
  const args = {
    potId,
    from: ids.alice,
    amount: 800,
    operationId: "durable-expense-1",
  };
  const first = await alice.mutation(api.expenses.createSpending, args);
  const retry = await alice.mutation(api.expenses.createSpending, args);
  expect(retry).toBe(first);
  expect(await potSpendings(potId)).toHaveLength(1);
});

it("deduplicates pot creation, scopes keys by actor and rejects changed requests", async () => {
  const args = {
    projectId: ids.family,
    name: "Retry",
    memberIds: [ids.alice, ids.bob],
    operationId: "pot-operation",
  };
  const first = await alice.mutation(api.expenses.createPot, args);
  expect(await alice.mutation(api.expenses.createPot, args)).toBe(first);
  await expect(
    alice.mutation(api.expenses.createPot, { ...args, name: "Changed" }),
  ).rejects.toThrow("OPERATION_CONFLICT");
  const bob = t.withIdentity({ subject: `${ids.bob}|session` });
  expect(await bob.mutation(api.expenses.createPot, args)).not.toBe(first);
  expect(await potMembers(first)).toHaveLength(2);
});

it("deduplicates settlements before checking the now-changed proposals", async () => {
  const potId = await makePot();
  await alice.mutation(api.expenses.createSpending, {
    potId,
    from: ids.alice,
    amount: 800,
  });
  const payments = [{ from: ids.bob, to: ids.alice, amount: 400 }];
  const args = {
    potId,
    payments,
    reviewedPayments: payments,
    operationId: "settlement-operation",
  };
  await alice.mutation(api.expenses.settlePayments, args);
  const settledAt = (await alice.query(api.expenses.getPot, { potId }))
    ?.settledAt;
  await alice.mutation(api.expenses.settlePayments, args);
  expect(await potSpendings(potId)).toHaveLength(2);
  expect((await alice.query(api.expenses.getPot, { potId }))?.settledAt).toBe(
    settledAt,
  );
});

it("rejects stale settlement review atomically and allows a fresh review", async () => {
  const potId = await makePot();
  await alice.mutation(api.expenses.createSpending, {
    potId,
    from: ids.alice,
    amount: 800,
  });
  const reviewedPayments = [{ from: ids.bob, to: ids.alice, amount: 400 }];
  await alice.mutation(api.expenses.createSpending, {
    potId,
    from: ids.bob,
    amount: 200,
  });
  const args = {
    potId,
    payments: reviewedPayments,
    reviewedPayments,
    operationId: "review-operation",
  };
  await expect(
    alice.mutation(api.expenses.settlePayments, args),
  ).rejects.toThrow("SETTLEMENT_CHANGED");
  expect(await potSpendings(potId)).toHaveLength(2);
  const payments = [{ from: ids.bob, to: ids.alice, amount: 300 }];
  await alice.mutation(api.expenses.settlePayments, {
    ...args,
    payments,
    reviewedPayments: payments,
  });
  expect(await potSpendings(potId)).toHaveLength(3);
});

it("does not mark an empty or partial settlement as fully settled", async () => {
  const potId = await makePot();
  await alice.mutation(api.expenses.createSpending, {
    potId,
    from: ids.alice,
    amount: 800,
  });
  await alice.mutation(api.expenses.settlePayments, { potId, payments: [] });
  expect(
    (await alice.query(api.expenses.getPot, { potId }))?.settledAt,
  ).toBeUndefined();
  await alice.mutation(api.expenses.settlePayments, {
    potId,
    payments: [{ from: ids.bob, to: ids.alice, amount: 100 }],
  });
  expect(
    (await alice.query(api.expenses.getPot, { potId }))?.settledAt,
  ).toBeUndefined();
});

it("does not let a receipt bypass membership checks or repeat side effects", async () => {
  const potId = await makePot();
  const args = {
    potId,
    from: ids.alice,
    amount: 800,
    operationId: "expense-side-effects",
  };
  await alice.mutation(api.expenses.createSpending, args);
  const before = await t.run((ctx) => ctx.db.query("notifications").collect());
  await alice.mutation(api.expenses.createSpending, args);
  expect(await t.run((ctx) => ctx.db.query("notifications").collect())).toEqual(
    before,
  );
  await t.run(async (ctx) => {
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", ids.family).eq("userId", ids.alice),
      )
      .unique();
    if (member) await ctx.db.delete(member._id);
  });
  await expect(
    alice.mutation(api.expenses.createSpending, args),
  ).rejects.toThrow();
});

it("deletes retained operation receipts when their account is deleted", async () => {
  await alice.mutation(api.expenses.createPot, {
    projectId: ids.family,
    name: "Trip",
    memberIds: [ids.alice, ids.bob],
    operationId: "account-receipt",
  });
  expect(
    await t.run((ctx) => ctx.db.query("expenseOperations").collect()),
  ).toHaveLength(1);
  await alice.mutation(api.users.deleteAccount, {});
  expect(
    await t.run((ctx) => ctx.db.query("expenseOperations").collect()),
  ).toEqual([]);
});
