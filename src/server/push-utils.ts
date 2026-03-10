import type { PushSubscription } from "web-push";

type StoredPushSubscription = {
  id: string;
  subscription: PushSubscription;
};

export function getSubscriptionEndpoint(subscription: PushSubscription) {
  return subscription.endpoint?.trim();
}

export function dedupePushSubscriptions<T extends StoredPushSubscription>(
  subscriptions: T[],
) {
  const seenEndpoints = new Set<string>();
  const duplicateIds: string[] = [];
  const invalidIds: string[] = [];
  const uniqueSubscriptions: T[] = [];

  for (const subscription of subscriptions) {
    const endpoint = getSubscriptionEndpoint(subscription.subscription);
    if (!endpoint) {
      invalidIds.push(subscription.id);
      continue;
    }

    if (seenEndpoints.has(endpoint)) {
      duplicateIds.push(subscription.id);
      continue;
    }

    seenEndpoints.add(endpoint);
    uniqueSubscriptions.push(subscription);
  }

  return {
    uniqueSubscriptions,
    duplicateIds,
    invalidIds,
  };
}

export function isExpiredSubscriptionError(error: unknown) {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return false;
  }

  return error.statusCode === 404 || error.statusCode === 410;
}
