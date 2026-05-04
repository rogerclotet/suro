import { eq, sql } from "drizzle-orm";
import type { PushSubscription } from "web-push";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";

export async function POST(request: Request) {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case "/api/web-push/subscription":
      return setSubscription(request);
    default:
      return new Response("Not found", { status: 404 });
  }
}

async function setSubscription(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body: { subscription: PushSubscription } = (await request.json()) as {
    subscription: PushSubscription;
  };
  if (!body.subscription) {
    return new Response("Missing subscription", { status: 400 });
  }

  const endpoint = body.subscription.endpoint?.trim();
  if (!endpoint) {
    return new Response("Missing subscription endpoint", { status: 400 });
  }

  const existing = await db.query.pushSubscriptions.findFirst({
    columns: { id: true, userId: true },
    where: sql`${pushSubscriptions.subscription} ->> 'endpoint' = ${endpoint}`,
  });

  if (existing && existing.userId !== session.user.id) {
    // Endpoint already bound to a different user. Refusing avoids letting an
    // attacker silently re-bind a captured endpoint to their own account
    // (which would route subsequent pushes to them).
    return new Response("Subscription endpoint already registered", {
      status: 409,
    });
  }

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({ subscription: body.subscription })
      .where(eq(pushSubscriptions.id, existing.id));
  } else {
    await db
      .insert(pushSubscriptions)
      .values({ subscription: body.subscription, userId: session.user.id });
  }

  return new Response();
}
