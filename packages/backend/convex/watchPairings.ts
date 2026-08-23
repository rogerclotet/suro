import { encodeBase64urlNoPadding } from "@oslojs/encoding";
import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { requireUserId } from "./model/auth";
import { sha256Hex } from "./reviewOtp";

/**
 * One-time tickets that let the Wear OS app claim its own Convex Auth session.
 * See WatchPairing.ts for why the watch needs a session of its own rather than a
 * copy of the phone's.
 */

/** Long enough that guessing is hopeless, short enough for a Data Layer item. */
const SECRET_BYTES = 32;

/** Tickets are handed over Bluetooth within seconds; minutes is generous. */
const TICKET_TTL_MS = 10 * 60 * 1000;

/**
 * Mint a pairing ticket for the signed-in user, returning the plaintext secret.
 * This is the only time the secret exists outside the caller — the row keeps
 * just its hash, so it can never be recovered from the database.
 *
 * Minting invalidates the user's previous tickets: the phone re-mints on every
 * foreground until the watch acks, and leaving a trail of live secrets behind
 * would widen the window for no benefit.
 */
export const createTicket = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const existing = await ctx.db
      .query("watchPairings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(existing.map((ticket) => ctx.db.delete(ticket._id)));

    const bytes = new Uint8Array(SECRET_BYTES);
    crypto.getRandomValues(bytes);
    const secret = encodeBase64urlNoPadding(bytes);

    await ctx.db.insert("watchPairings", {
      userId,
      secretHash: sha256Hex(secret),
      expiresAt: Date.now() + TICKET_TTL_MS,
    });
    return { secret };
  },
});

/**
 * Redeem a ticket by hash, returning the user it was minted for. Internal: only
 * the `watch-pairing` auth provider calls this.
 *
 * A successful redemption deletes the row, so the secret is single-use. An
 * expired one throws instead, which rolls the delete back with the rest of the
 * transaction — harmless, since an expired row can never redeem again, and
 * `pruneExpired` sweeps it.
 */
export const redeemTicket = internalMutation({
  args: { secretHash: v.string() },
  handler: async (ctx, { secretHash }) => {
    const ticket = await ctx.db
      .query("watchPairings")
      .withIndex("by_secretHash", (q) => q.eq("secretHash", secretHash))
      .unique();
    if (ticket === null) {
      throw new Error("Invalid watch pairing ticket");
    }
    await ctx.db.delete(ticket._id);
    if (ticket.expiresAt <= Date.now()) {
      throw new Error("Watch pairing ticket has expired");
    }
    return ticket.userId;
  },
});

/**
 * Sweep tickets nobody redeemed. Expiry is already enforced at redemption, so
 * this only keeps the table from accumulating dead rows.
 */
export const pruneExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("watchPairings")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", Date.now()))
      .collect();
    await Promise.all(expired.map((ticket) => ctx.db.delete(ticket._id)));
    return expired.length;
  },
});
