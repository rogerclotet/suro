import { describe, expect, it } from "vitest";
import type { PushSubscription } from "web-push";
import {
  dedupePushSubscriptions,
  getSubscriptionEndpoint,
  isExpiredSubscriptionError,
} from "./push-utils";

function createSubscription(endpoint?: string): PushSubscription {
  return {
    endpoint: endpoint ?? "",
    expirationTime: null,
    keys: {
      auth: "auth",
      p256dh: "p256dh",
    },
  };
}

describe("getSubscriptionEndpoint", () => {
  it("trims the subscription endpoint", () => {
    expect(
      getSubscriptionEndpoint(
        createSubscription(" https://example.test/push "),
      ),
    ).toBe("https://example.test/push");
  });
});

describe("dedupePushSubscriptions", () => {
  it("drops duplicate and invalid subscriptions", () => {
    const subscriptions = dedupePushSubscriptions([
      { id: "1", subscription: createSubscription("https://push.test/a") },
      { id: "2", subscription: createSubscription("https://push.test/a") },
      { id: "3", subscription: createSubscription("https://push.test/b") },
      { id: "4", subscription: createSubscription("") },
    ]);

    expect(subscriptions.uniqueSubscriptions.map((item) => item.id)).toEqual([
      "1",
      "3",
    ]);
    expect(subscriptions.duplicateIds).toEqual(["2"]);
    expect(subscriptions.invalidIds).toEqual(["4"]);
  });
});

describe("isExpiredSubscriptionError", () => {
  it("only marks 404 and 410 responses as prunable", () => {
    expect(isExpiredSubscriptionError({ statusCode: 404 })).toBe(true);
    expect(isExpiredSubscriptionError({ statusCode: 410 })).toBe(true);
    expect(isExpiredSubscriptionError({ statusCode: 429 })).toBe(false);
    expect(isExpiredSubscriptionError(new Error("boom"))).toBe(false);
  });
});
