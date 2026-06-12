import Resend from "@auth/core/providers/resend";
import type { GenericActionCtx } from "convex/server";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { reviewAccountConfig, sha256Hex } from "./reviewOtp";

/**
 * Email one-time-code provider (Convex Auth). Sends a 6-digit code via Resend
 * instead of a magic link — the native-friendly flow (no deep links/redirects).
 * Requires the deployment env vars AUTH_RESEND_KEY and (optionally) AUTH_EMAIL_FROM.
 * Optional: AUTH_REVIEW_EMAIL + AUTH_REVIEW_OTP enable the app-store review
 * demo account (fixed code, no email) — see `reviewOtp.ts`.
 */
function generateOtp(): string {
  const digits = new Uint8Array(6);
  crypto.getRandomValues(digits);
  return Array.from(digits, (byte) => (byte % 10).toString()).join("");
}

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // codes valid for 15 minutes
  async generateVerificationToken() {
    return generateOtp();
  },
  async sendVerificationRequest(
    { identifier: email, provider, token },
    // Convex Auth passes its action ctx as a second argument; the Auth.js type
    // doesn't declare it, so it has to be optional here.
    ctx?: GenericActionCtx<DataModel>,
  ) {
    const review = reviewAccountConfig();
    if (review !== null && email.toLowerCase() === review.email) {
      if (ctx === undefined) {
        throw new Error("Review OTP requires the Convex Auth action ctx");
      }
      // Replace the issued code with the fixed review code and skip the email.
      await ctx.runMutation(internal.reviewOtp.swapToFixedCode, {
        issuedCodeHash: sha256Hex(token),
        fixedCodeHash: sha256Hex(review.otp),
      });
      return;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM ?? "Suro <onboarding@resend.dev>",
        to: [email],
        subject: "Your Suro sign-in code",
        text: `Your Suro sign-in code is ${token}\n\nIt expires in 15 minutes.`,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Resend error ${response.status}: ${await response.text()}`,
      );
    }
  },
});
