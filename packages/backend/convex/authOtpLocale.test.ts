import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

describe("authOtpLocale", () => {
  it("prefers the user's stored locale", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        email: "user@example.com",
        locale: "es",
      });
    });

    const locale = await t.query(internal.authOtpLocale.resolveLocale, {
      email: "user@example.com",
    });
    expect(locale).toBe("es");
  });

  it("falls back to a staged locale for new users", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.authOtpLocale.stage, {
      email: "new@example.com",
      locale: "en",
    });

    const locale = await t.query(internal.authOtpLocale.resolveLocale, {
      email: "new@example.com",
    });
    expect(locale).toBe("en");
  });

  it("defaults to Catalan when no locale is known", async () => {
    const t = convexTest(schema, modules);
    const locale = await t.query(internal.authOtpLocale.resolveLocale, {
      email: "unknown@example.com",
    });
    expect(locale).toBe("ca");
  });
});
