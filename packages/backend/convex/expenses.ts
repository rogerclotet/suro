import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { track } from "./model/analytics";
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
      // `createdAt` is set only for migrated pots; native ones fall back to
      // `_creationTime` (which equals their creation time).
      return (
        (b.createdAt ?? b._creationTime) - (a.createdAt ?? a._creationTime)
      );
    });
  },
});

/**
 * The mobile/web expenses overview: every active pot plus a page of the most
 * recently settled ones. Settled pots pile up once a trip is over, so we trim
 * the payload with `settledLimit` and grow it behind "show more" — mirrors the
 * lists overview (`lists.ts:overviewByProject`). `listPots` stays the full list
 * for pickers that need every pot.
 */
export const listPotsOverview = query({
  args: { projectId: v.id("projects"), settledLimit: v.number() },
  handler: async (ctx, { projectId, settledLimit }) => {
    await requireProjectMember(ctx, projectId);
    const pots = await ctx.db
      .query("pots")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // `createdAt` is set only for migrated pots; native ones fall back to
    // `_creationTime` (which equals their creation time).
    const active = pots
      .filter((pot) => !pot.settledAt)
      .sort(
        (a, b) =>
          (b.createdAt ?? b._creationTime) - (a.createdAt ?? a._creationTime),
      );
    const settled = pots
      .filter(
        (pot): pot is typeof pot & { settledAt: number } => !!pot.settledAt,
      )
      .sort((a, b) => b.settledAt - a.settledAt);

    const limit = Math.max(0, Math.floor(settledLimit));
    const settledPage = settled.slice(0, limit);

    // Enrich only the pots we return — settled pots beyond the page never load.
    const withMembers = async (pot: Doc<"pots">) => {
      const ids = await potMemberIds(ctx, pot._id);
      const users = await Promise.all(ids.map((id) => ctx.db.get(id)));
      return { ...pot, members: users.map(publicUser) };
    };

    return {
      active: await Promise.all(active.map(withMembers)),
      settled: await Promise.all(settledPage.map(withMembers)),
      hasMoreSettled: settled.length > limit,
    };
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

    // Newest first by effective creation time: migrated spendings carry the
    // source `createdAt`; native ones fall back to `_creationTime`.
    const spendingDocs = (
      await ctx.db
        .query("spendings")
        .withIndex("by_pot", (q) => q.eq("potId", potId))
        .collect()
    ).sort(
      (a, b) =>
        (b.createdAt ?? b._creationTime) - (a.createdAt ?? a._creationTime),
    );
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
    await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
      projectId,
      actorId: userId,
      bodyKey: "pot_created",
      bodyParams: { name: trimmed },
      path: `/${projectId}/expenses`,
    });
    await track(ctx, userId, "pot_created", {
      projectId,
      memberCount: unique.length,
    });
    return potId;
  },
});

/**
 * Delete a pot, but only when it's settled or not-yet-started (no spendings) —
 * an in-progress pot keeps its recorded expenses. Any project member may delete
 * (matches event/list removal). Cascades its members and any settle-up rows.
 */
export const deletePot = mutation({
  args: { potId: v.id("pots") },
  handler: async (ctx, { potId }) => {
    const { pot, userId } = await requirePotAccess(ctx, potId);
    const spendings = await ctx.db
      .query("spendings")
      .withIndex("by_pot", (q) => q.eq("potId", potId))
      .collect();
    const deletable = pot.settledAt !== undefined || spendings.length === 0;
    if (!deletable) {
      throw new Error("Only settled or not-yet-started pots can be deleted");
    }
    // Manual cascade (Convex has no FK cascade) — mirrors projects.remove.
    const members = await ctx.db
      .query("potMembers")
      .withIndex("by_pot", (q) => q.eq("potId", potId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    for (const spending of spendings) {
      await ctx.db.delete(spending._id);
    }
    await ctx.db.delete(potId);
    await track(ctx, userId, "pot_deleted", { projectId: pot.projectId });
    return null;
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
    const cleanDescription = description?.trim();
    await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
      projectId: pot.projectId,
      actorId: userId,
      bodyKey: cleanDescription
        ? "spending_created_with_description"
        : "spending_created",
      bodyParams: cleanDescription
        ? { amount: (amount / 100).toFixed(2), description: cleanDescription }
        : { amount: (amount / 100).toFixed(2) },
      path: `/${pot.projectId}/expenses`,
    });
    await track(ctx, userId, "spending_created", {
      projectId: pot.projectId,
      split: to === undefined ? "equal" : "single",
    });
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
    await track(ctx, userId, "payments_settled", {
      projectId: pot.projectId,
      paymentCount: payments.length,
    });
    return null;
  },
});
