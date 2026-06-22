import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const DEFAULT_HOST = "https://eu.i.posthog.com";

/**
 * Fire-and-forget a product-analytics event to PostHog. Scheduled off the
 * mutation transaction by `model/analytics.track` (via
 * `ctx.scheduler.runAfter(0, ...)`), mirroring `push.sendToProject`: it runs in
 * the V8 runtime, uses raw `fetch` (no `posthog-node`, which needs the Node
 * runtime), and only logs on failure so analytics never breaks a write.
 *
 * `distinctId` is the Convex user id — the same value the web and mobile clients
 * pass to `posthog.identify(...)` — so server, web, and mobile events merge onto
 * one person. No-op when `POSTHOG_PROJECT_KEY` is unset (e.g. local dev).
 */
export const capture = internalAction({
  args: {
    distinctId: v.string(),
    event: v.string(),
    properties: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (_ctx, { distinctId, event, properties }) => {
    const apiKey = process.env.POSTHOG_PROJECT_KEY;
    if (!apiKey) {
      return null;
    }
    const host = process.env.POSTHOG_HOST ?? DEFAULT_HOST;
    try {
      const response = await fetch(`${host}/i/v0/e/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          event,
          distinct_id: distinctId,
          properties: { ...properties, $lib: "convex-server" },
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        console.error(`PostHog capture returned ${response.status}`);
      }
    } catch (error) {
      console.error("PostHog capture request failed", error);
    }
    return null;
  },
});
