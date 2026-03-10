import { sql } from "drizzle-orm";
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

  await db.transaction(async (trx) => {
    await trx
      .delete(pushSubscriptions)
      .where(
        sql`${pushSubscriptions.subscription} ->> 'endpoint' = ${endpoint}`,
      );

    await trx
      .insert(pushSubscriptions)
      .values({ subscription: body.subscription, userId: session.user.id });
  });

  return new Response();
}
