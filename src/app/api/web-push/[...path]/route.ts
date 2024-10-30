import { auth } from "@/auth";
import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";
import { type PushSubscription } from "web-push";

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

  await db
    .insert(pushSubscriptions)
    .values({ subscription: body.subscription, userId: session.user.id });

  return new Response();
}
