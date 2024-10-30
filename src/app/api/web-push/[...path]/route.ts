import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";
import { sendPushNotification } from "@/server/push";
import { type PushSubscription } from "web-push";

export async function POST(request: Request) {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case "/api/web-push/subscription":
      return setSubscription(request);
    case "/api/web-push/send":
      return sendPush(request);
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

async function sendPush(project: Project, request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = (await request.json()) as {
    message: string;
    title?: string;
    path?: string;
  };

  try {
    await sendPushNotification(
      project,
      payload.message,
      payload.title,
      payload.path,
    );
  } catch (error) {
    console.error("Failed to send push notification", error);
    return new Response("Failed to send push notification", { status: 500 });
  }

  return new Response();
}
