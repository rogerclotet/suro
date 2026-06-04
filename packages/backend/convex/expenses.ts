import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { calculateBalances, generateProposals } from "./model/expenses";
import { requirePotAccess, requireProjectMember } from "./model/permissions";

/** The user fields the expenses UI needs (name + avatar). */
function publicUser(user: Doc<"users"> | null) {
  return {
    _id: user?._id ?? null,
    name: user?.name ?? null,
    image: user?.customImage ?? user?.image ?? null,
    avatarColor: user?.avatarColor ?? null,
  };
}

/** The user ids belonging to a pot. */
async function potMemberIds(ctx: QueryCtx, potId: Id<"pots">) {
  const members = await ctx.db
    .query("potMembers")
    .withIndex("by_pot", (q) => q.eq("potId", potId))
    .collect();
  return members.map((m) => m.userId);
}

/** All project pots, active first then settled, each with its members. */
export const listPots = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const pots = await ctx.db
      .query("pots")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const withMembers = await Promise.all(
      pots.map(async (pot) => {
        const ids = await potMemberIds(ctx, pot._id);
        const users = await Promise.all(ids.map((id) => ctx.db.get(id)));
        return { ...pot, members: users.map(publicUser) };
      }),
    );

    // Active pots first (newest first), then settled (most recently settled).
    return withMembers.sort((a, b) => {
      if (!a.settledAt && b.settledAt) {
        return -1;
      }
      if (a.settledAt && !b.settledAt) {
        return 1;
      }
      if (a.settledAt && b.settledAt) {
        return b.settledAt - a.settledAt;
      }
      return b._creationTime - a._creationTime;
    });
  },
});

/**
 * A pot with its members, spendings (newest first, enriched with payer/payee
 * names), per-member balances, and the suggested settle-up payments.
 */
export const getPot = query({
  args: { potId: v.id("pots") },
  handler: async (ctx, { potId }) => {
    const { pot } = await requirePotAccess(ctx, potId);

    const memberIds = await potMemberIds(ctx, potId);
    const memberDocs = await Promise.all(memberIds.map((id) => ctx.db.get(id)));
    const members = memberDocs.map(publicUser);
    const nameById = new Map(
      memberDocs.filter((u) => u !== null).map((u) => [u._id, u.name ?? null]),
    );

    const spendingDocs = await ctx.db
      .query("spendings")
      .withIndex("by_pot", (q) => q.eq("potId", potId))
      .order("desc")
      .collect();
    const spendings = spendingDocs.map((s) => ({
      ...s,
      fromName: s.from ? (nameById.get(s.from) ?? null) : null,
      toName: s.to ? (nameById.get(s.to) ?? null) : null,
    }));

    const balanceMap = calculateBalances(memberIds, spendingDocs);
    const balances = members
      .filter((m) => m._id !== null)
      .map((m) => ({
        user: m,
        amount: balanceMap.get(m._id as Id<"users">) ?? 0,
      }));

    const settlements = generateProposals(balanceMap).map((p) => ({
      ...p,
      fromName: nameById.get(p.from) ?? null,
      toName: nameById.get(p.to) ?? null,
    }));

    return { ...pot, members, spendings, balances, settlements };
  },
});

export const createPot = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, { projectId, name, memberIds }) => {
    const userId = await requireProjectMember(ctx, projectId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Pot name is required");
    }
    // De-dupe and require at least two members, all of them in the project.
    const unique = [...new Set(memberIds)];
    if (unique.length < 2) {
      throw new Error("A pot needs at least two members");
    }
    for (const memberId of unique) {
      const membership = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", projectId).eq("userId", memberId),
        )
        .unique();
      if (membership === null) {
        throw new Error("Member is not in this group");
      }
    }

    const potId = await ctx.db.insert("pots", {
      name: trimmed,
      projectId,
      createdBy: userId,
    });
    for (const memberId of unique) {
      await ctx.db.insert("potMembers", { potId, userId: memberId });
    }
    return potId;
  },
});

export const createSpending = mutation({
  args: {
    potId: v.id("pots"),
    amount: v.number(),
    description: v.optional(v.string()),
    from: v.id("users"),
    // Omit `to` to split equally among all pot members.
    to: v.optional(v.id("users")),
  },
  handler: async (ctx, { potId, amount, description, from, to }) => {
    const { pot, userId } = await requirePotAccess(ctx, potId);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number");
    }
    const memberIds = await potMemberIds(ctx, potId);
    if (!memberIds.includes(from)) {
      throw new Error("Payer is not in this pot");
    }
    if (to !== undefined) {
      if (!memberIds.includes(to)) {
        throw new Error("Recipient is not in this pot");
      }
      if (to === from) {
        throw new Error("Payer and recipient must differ");
      }
    }

    const spendingId = await ctx.db.insert("spendings", {
      amount,
      currency: "EUR",
      description: description?.trim() || undefined,
      from,
      to,
      projectId: pot.projectId,
      potId,
      createdBy: userId,
    });
    // Adding a spending reopens a settled pot (mirrors the PWA).
    if (pot.settledAt !== undefined) {
      await ctx.db.patch(pot._id, { settledAt: undefined });
    }
    return spendingId;
  },
});

export const settlePayments = mutation({
  args: {
    potId: v.id("pots"),
    payments: v.array(
      v.object({
        from: v.id("users"),
        to: v.id("users"),
        amount: v.number(),
      }),
    ),
  },
  handler: async (ctx, { potId, payments }) => {
    const { pot, userId } = await requirePotAccess(ctx, potId);
    const memberIds = await potMemberIds(ctx, potId);

    for (const payment of payments) {
      if (!Number.isInteger(payment.amount) || payment.amount <= 0) {
        throw new Error("Settlement amount must be positive");
      }
      if (
        !memberIds.includes(payment.from) ||
        !memberIds.includes(payment.to)
      ) {
        throw new Error("Settlement involves a non-member");
      }
      await ctx.db.insert("spendings", {
        amount: payment.amount,
        currency: "EUR",
        description: "Settle up",
        from: payment.from,
        to: payment.to,
        projectId: pot.projectId,
        potId,
        createdBy: userId,
      });
    }
    await ctx.db.patch(pot._id, { settledAt: Date.now() });
    return null;
  },
});
