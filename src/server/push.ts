import { env } from "@/env";
import { sendNotification, setVapidDetails } from "web-push";
import { db } from "./db";
import { auth } from "@/auth";
import { inArray } from "drizzle-orm";
import { pushSubscriptions } from "./db/schema";
import type { Project } from "@/app/_data/project";

export async function sendProjectNotification({
  project,
  body,
  title,
  path,
  image,
}: {
  project: Project;
  body: string;
  title?: string;
  path?: string;
  image?: string;
}) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const usersToNotify = project.users.filter(
    (u) => u.user.id !== session.user.id,
  );
  if (usersToNotify.length === 0) {
    return;
  }

  await sendNotificationsToUsers({
    users: usersToNotify.map((u) => u.user.id),
    body,
    title,
    path,
    image,
  });
}

export async function sendNotificationsToUsers({
  users,
  body,
  title,
  path,
  image,
}: {
  users: string[];
  body: string;
  title?: string;
  path?: string;
  image?: string;
}) {
  setVapidDetails(
    "mailto:roger@clotet.dev",
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  if (users.length === 0) {
    return;
  }

  const subscriptions = await db.query.pushSubscriptions.findMany({
    where: inArray(pushSubscriptions.userId, users),
  });

  const pushPayload = JSON.stringify({
    title,
    body,
    path,
    image,
  });

  const notificationPromises = [];
  for (const subscription of subscriptions) {
    notificationPromises.push(
      sendNotification(subscription.subscription, pushPayload),
    );
  }

  const results = await Promise.allSettled(notificationPromises);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to send notification", result.reason);
    }
  }
}