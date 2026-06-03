import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verificationTokens } from "@/server/db/schema";

// Mirrors auth/core's createHash: SHA-256(rawToken + secret) as hex.
// Auth.js hashes the URL token on the callback side before looking it up,
// so the DB must contain the hash, not the raw token.
async function hashToken(rawToken: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const data = new TextEncoder().encode(`${rawToken}${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// One-click login for ephemeral preview environments.
// Only active when PREVIEW_AUTH_EMAIL is set; always returns 404 in production.
export async function GET(): Promise<NextResponse> {
  const email = process.env.PREVIEW_AUTH_EMAIL;
  if (!email) return new NextResponse("Not found", { status: 404 });

  const rawToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));
  await db
    .insert(verificationTokens)
    .values({ identifier: email, token: await hashToken(rawToken), expires });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const callbackUrl = new URL("/api/auth/callback/resend", base);
  callbackUrl.searchParams.set("callbackUrl", "/");
  callbackUrl.searchParams.set("token", rawToken);
  callbackUrl.searchParams.set("email", email);

  return NextResponse.redirect(callbackUrl);
}
