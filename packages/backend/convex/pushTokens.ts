import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUserId } from "./model/auth";

/**
 * Register (or re-point) the calling device's Expo push token. Deduped by the
 * token string: if the same device later signs in as a different user, the row
 * is reassigned instead of duplicated.
 */
export const register = mutation({
  args: { token: v.string(), platform: v.optional(v.string()) },
  handler: async (ctx, { token, platform }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing) {
      if (existing.userId !== userId || existing.platform !== platform) {
        await ctx.db.patch(existing._id, { userId, platform });
      }
      return null;
    }
    await ctx.db.insert("pushTokens", { userId, token, platform });
    return null;
  },
});

/**
 * Drop the calling device's token (on sign-out). Called while still
 * authenticated, so it only removes a row the caller owns.
 */
export const unregister = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing && existing.userId === userId) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
