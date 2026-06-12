import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * App-review demo account: store reviewers (Apple/Google) must be able to sign
 * in, but our email OTP flow emails a random code — useless to a reviewer.
 * When BOTH deployment env vars are set:
 *   AUTH_REVIEW_EMAIL — the reserved reviewer email (e.g. review@suro.clotet.dev)
 *   AUTH_REVIEW_OTP   — the fixed code handed to the stores' review teams
 * sign-ins for that one email accept the fixed code instead of an emailed one
 * (see ResendOTP.sendVerificationRequest). Unset on deployments that don't
 * need it; everything here is a no-op then.
 */
export function reviewAccountConfig(): { email: string; otp: string } | null {
  const email = process.env.AUTH_REVIEW_EMAIL;
  const otp = process.env.AUTH_REVIEW_OTP;
  if (!email || !otp) {
    return null;
  }
  return { email: email.toLowerCase(), otp };
}

/** Hex-encoded SHA-256, matching @convex-dev/auth's internal code hashing. */
export function sha256Hex(input: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(input)));
}

/**
 * Swap the just-issued verification code for the fixed review code. Convex
 * Auth stores `sha256(code)` in `authVerificationCodes` and later looks the
 * row up by the hash of the submitted code, so re-pointing the stored hash is
 * all that's needed for the fixed code to verify (expiry, rate limiting and
 * single-use deletion still apply unchanged).
 */
export const swapToFixedCode = internalMutation({
  args: {
    issuedCodeHash: v.string(),
    fixedCodeHash: v.string(),
  },
  handler: async (ctx, { issuedCodeHash, fixedCodeHash }) => {
    const row = await ctx.db
      .query("authVerificationCodes")
      .withIndex("code", (q) => q.eq("code", issuedCodeHash))
      .unique();
    if (row === null) {
      throw new Error(
        "Issued verification code not found — cannot apply the review OTP",
      );
    }
    await ctx.db.patch(row._id, { code: fixedCodeHash });
  },
});
