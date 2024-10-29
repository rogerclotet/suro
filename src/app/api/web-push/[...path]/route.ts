import { env } from "@/env";
import {
  sendNotification,
  setVapidDetails,
  type PushSubscription,
} from "web-push";

let subscription: PushSubscription;

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
  const body: { subscription: PushSubscription } = (await request.json()) as {
    subscription: PushSubscription;
  };
  if (!body.subscription) {
    return new Response("Missing subscription", { status: 400 });
  }

  subscription = body.subscription;
  return new Response();
}

async function sendPush(request: Request) {
  setVapidDetails(
    "mailto:roger@clotet.dev",
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  const payload: object = (await request.json()) as object;
  const pushPayload = JSON.stringify({
    ...payload,
  });

  setTimeout(() => {
    sendNotification(subscription, pushPayload).catch((err) => {
      console.error("Failed to send notification", err);
    });
  }, 5000);

  return new Response();
}
