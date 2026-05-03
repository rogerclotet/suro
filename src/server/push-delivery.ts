import { inArray } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";
import { env } from "@/env";
import { db } from "./db";
import { pushSubscriptions } from "./db/schema";
import {
  buildLocalizedUrl,
  translateNotificationBody,
} from "./notification-i18n";
import {
  dedupePushSubscriptions,
  isExpiredSubscriptionError,
} from "./push-utils";
import { getUsersLocaleMap } from "./user-locales";

export async function sendNotificationsToUsers({
  users,
  body,
  bodyKey,
  bodyParams,
  title,
  path,
  image,
}: {
  users: string[];
  body: string;
  bodyKey?: string;
  bodyParams?: Record<string, unknown> | null;
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

  const userLocales = bodyKey
    ? await getUsersLocaleMap(uniqueSubscriptions.map((s) => s.userId))
    : new Map<string, string>();

  const notificationPromises = uniqueSubscriptions.map(async (subscription) => {
    let localizedBody = body;
    let localizedPath = path;

    if (bodyKey) {
      const locale = userLocales.get(subscription.userId);
      localizedBody = await translateNotificationBody(
        bodyKey,
        bodyParams ?? null,
        locale,
        body,
      );
      if (path && locale) {
        localizedPath = await buildLocalizedUrl(
          path,
          // biome-ignore lint/suspicious/noExplicitAny: locale was already normalized in getUsersLocaleMap
          locale as any,
        );
      }
    }

    const pushPayload = JSON.stringify({
      title,
      body: localizedBody,
      path: localizedPath,
      image,
    });

    return sendNotification(subscription.subscription, pushPayload);
  });

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
