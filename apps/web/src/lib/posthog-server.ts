import { PostHog } from "posthog-node";
import { env } from "@/env";

let posthogInstance: PostHog | null = null;

export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
      disabled: process.env.NODE_ENV !== "production",
      enableExceptionAutocapture: process.env.NODE_ENV === "production",
    });
  }

  return posthogInstance;
}
