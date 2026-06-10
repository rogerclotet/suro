import Resend from "@auth/core/providers/resend";

/**
 * Email one-time-code provider (Convex Auth). Sends a 6-digit code via Resend
 * instead of a magic link — the native-friendly flow (no deep links/redirects).
 * Requires the deployment env vars AUTH_RESEND_KEY and (optionally) AUTH_EMAIL_FROM.
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
  async sendVerificationRequest({ identifier: email, provider, token }) {
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
