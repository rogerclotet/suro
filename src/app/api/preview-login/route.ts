import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verificationTokens } from "@/server/db/schema";

// One-click login for ephemeral preview environments.
// Only active when PREVIEW_AUTH_EMAIL is set; always returns 404 in production.
export async function GET(request: Request): Promise<NextResponse> {
  const email = process.env.PREVIEW_AUTH_EMAIL;
  if (!email) return new NextResponse("Not found", { status: 404 });

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));
  await db
    .insert(verificationTokens)
    .values({ identifier: email, token, expires });

  const { origin } = new URL(request.url);
  const callbackUrl = new URL("/api/auth/callback/resend", origin);
  callbackUrl.searchParams.set("callbackUrl", "/");
  callbackUrl.searchParams.set("token", token);
  callbackUrl.searchParams.set("email", email);

  return NextResponse.redirect(callbackUrl);
}
