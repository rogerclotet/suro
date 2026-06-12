import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import { sha256Hex } from "./reviewOtp";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

const REVIEW_EMAIL = "review@suro.clotet.dev";

describe("sha256Hex", () => {
  it("matches @convex-dev/auth's code hashing (hex-encoded SHA-256)", () => {
    // Known SHA-256("abc") test vector — guards against encoding drift, since
    // verifyCodeAndSignIn looks rows up by exactly this hash format.
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("swapToFixedCode", () => {
  it("re-points the stored hash so the fixed review code verifies", async () => {
    const t = convexTest(schema, modules);
    const codeId = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { email: REVIEW_EMAIL });
      const accountId = await ctx.db.insert("authAccounts", {
        userId,
        provider: "resend-otp",
        providerAccountId: REVIEW_EMAIL,
      });
      return await ctx.db.insert("authVerificationCodes", {
        accountId,
        provider: "resend-otp",
        code: sha256Hex("123456"),
        expirationTime: Date.now() + 15 * 60 * 1000,
      });
    });

    await t.mutation(internal.reviewOtp.swapToFixedCode, {
      issuedCodeHash: sha256Hex("123456"),
      fixedCodeHash: sha256Hex("424242"),
    });

    const row = await t.run((ctx) => ctx.db.get(codeId));
    expect(row?.code).toBe(sha256Hex("424242"));
  });

  it("throws when the issued code is not found", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.reviewOtp.swapToFixedCode, {
        issuedCodeHash: sha256Hex("000000"),
        fixedCodeHash: sha256Hex("424242"),
      }),
    ).rejects.toThrow(/not found/);
  });
});
