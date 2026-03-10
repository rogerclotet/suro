import { inArray } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";
import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { env } from "@/env";
import { db } from "./db";
import { pushSubscriptions } from "./db/schema";
import {
  dedupePushSubscriptions,
  isExpiredSubscriptionError,
} from "./push-utils";

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
  const { uniqueSubscriptions, duplicateIds, invalidIds } =
    dedupePushSubscriptions(subscriptions);

  const idsToPrune = [...duplicateIds, ...invalidIds];
  if (idsToPrune.length > 0) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.id, idsToPrune));
  }

  const pushPayload = JSON.stringify({
    title,
    body,
    path,
    image,
  });

  const notificationPromises = uniqueSubscriptions.map((subscription) =>
    sendNotification(subscription.subscription, pushPayload),
  );

  const results = await Promise.allSettled(notificationPromises);
  const expiredSubscriptionIds: string[] = [];
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      if (isExpiredSubscriptionError(result.reason)) {
        const subscription = uniqueSubscriptions[index];
        if (subscription) {
          expiredSubscriptionIds.push(subscription.id);
        }
        continue;
      }

      console.error("Failed to send notification", result.reason);
    }
  }

  if (expiredSubscriptionIds.length > 0) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.id, expiredSubscriptionIds));
  }
}
