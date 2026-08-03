import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

const SUPPORTED_LOCALES = new Set(["ca", "es", "en"]);
const OTP_LOCALE_TTL_MS = 15 * 60 * 1000;

type Locale = "ca" | "es" | "en";

function normalizeLocale(locale: string): Locale {
  return locale === "es" ? "es" : locale === "en" ? "en" : "ca";
}

/**
 * Stash the UI locale before requesting an OTP email. New users don't have a
 * stored preference yet, and returning users may be signing in from a device
 * set to another language — this short-lived record lets the email match the
 * login screen they just used.
 */
export const stage = mutation({
  args: {
    email: v.string(),
    locale: v.string(),
  },
  handler: async (ctx, { email, locale }) => {
    const normalizedLocale = normalizeLocale(locale);
    if (!SUPPORTED_LOCALES.has(normalizedLocale)) {
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === "") {
      return;
    }
    const expiresAt = Date.now() + OTP_LOCALE_TTL_MS;
    const existing = await ctx.db
      .query("authOtpLocales")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();
    if (existing !== null) {
      await ctx.db.patch(existing._id, { locale: normalizedLocale, expiresAt });
      return;
    }
    await ctx.db.insert("authOtpLocales", {
      email: normalizedEmail,
      locale: normalizedLocale,
      expiresAt,
    });
  },
});

export const resolveLocale = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .unique();
    if (user?.locale !== undefined) {
      return normalizeLocale(user.locale);
    }
    const pending = await ctx.db
      .query("authOtpLocales")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();
    if (pending !== null && pending.expiresAt > Date.now()) {
      return normalizeLocale(pending.locale);
    }
    return "ca" as const;
  },
});

export const clearPending = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const pending = await ctx.db
      .query("authOtpLocales")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();
    if (pending !== null) {
      await ctx.db.delete(pending._id);
    }
  },
});
