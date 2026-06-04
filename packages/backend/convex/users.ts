import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./model/auth";
import { CATPPUCCIN_COLOR_KEYS } from "./model/colors";

/** The current signed-in user, or null. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return ctx.db.get(userId);
  },
});

const CATPPUCCIN_COLORS = new Set<string>(CATPPUCCIN_COLOR_KEYS);
const SUPPORTED_LOCALES = new Set(["ca", "es", "en"]);

/**
 * Update the current user's editable profile fields. Each arg is optional so
 * the client can patch one field at a time (e.g. tap a color swatch). Passing
 * `null` for `avatarColor` clears it; an unknown color is treated as cleared.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarColor: v.optional(v.union(v.string(), v.null())),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const patch: {
      name?: string;
      avatarColor?: string | undefined;
      locale?: string;
    } = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name === "") {
        throw new Error("Name is required");
      }
      patch.name = name;
    }

    if (args.avatarColor !== undefined) {
      // null or any non-palette value clears the field (falls back to default).
      patch.avatarColor =
        args.avatarColor && CATPPUCCIN_COLORS.has(args.avatarColor)
          ? args.avatarColor
          : undefined;
    }

    if (args.locale !== undefined) {
      if (!SUPPORTED_LOCALES.has(args.locale)) {
        throw new Error("Unsupported locale");
      }
      patch.locale = args.locale;
    }

    await ctx.db.patch(userId, patch);
    return null;
  },
});

/**
 * Short-lived URL the client POSTs the avatar bytes to (Convex storage). Only
 * gated by auth — avatars aren't project-scoped.
 */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/**
 * Persist a freshly uploaded avatar: store its serving URL in `customImage`
 * (so existing consumers keep reading a plain URL) and the storage id so the
 * file can be cleaned up later. Deletes the previously uploaded avatar, if any.
 */
export const setAvatarImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    const url = await ctx.storage.getUrl(storageId);
    if (url === null) {
      throw new Error("Uploaded image not found");
    }
    if (user?.customImageStorageId) {
      await ctx.storage.delete(user.customImageStorageId);
    }
    await ctx.db.patch(userId, {
      customImage: url,
      customImageStorageId: storageId,
    });
    return null;
  },
});

/**
 * Remove the avatar entirely (custom upload *and* provider image), falling back
 * to initials. Mirrors the web "remove image" action.
 */
export const removeAvatarImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.customImageStorageId) {
      await ctx.storage.delete(user.customImageStorageId);
    }
    await ctx.db.patch(userId, {
      customImage: undefined,
      customImageStorageId: undefined,
      image: undefined,
    });
    return null;
  },
});

/**
 * Drop a custom avatar so the provider (Google) image shows again. Mirrors the
 * web "reset to Google image" action; no-op visible effect if there's no
 * provider image, which the UI only offers the action when one exists.
 */
export const resetProviderImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.customImageStorageId) {
      await ctx.storage.delete(user.customImageStorageId);
    }
    await ctx.db.patch(userId, {
      customImage: undefined,
      customImageStorageId: undefined,
    });
    return null;
  },
});
