import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Analytics property values — ids, counts, types, and flags only. Never PII:
 * no names, emails, descriptions, amounts, or other free text.
 */
type AnalyticsProperties = Record<string, string | number | boolean | string[]>;

/**
 * Record a product-analytics event for `userId`. Fire-and-forget: it schedules
 * `analytics.capture` off the transaction (like `push.sendToProject`), so a
 * failed capture never blocks or fails the mutation. `userId` (the Convex user
 * id) becomes the PostHog `distinct_id`, matching how the web and mobile clients
 * identify, so all three surfaces merge onto one person.
 */
export async function track(
  ctx: MutationCtx,
  userId: Id<"users">,
  event: string,
  properties?: AnalyticsProperties,
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.analytics.capture, {
    distinctId: userId,
    event,
    properties,
  });
}
