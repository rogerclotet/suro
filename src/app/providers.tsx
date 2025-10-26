"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { env } from "@/env";

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
  });
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
