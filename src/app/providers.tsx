"use client";

import { env } from "@/env";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  posthog.init(env.POSTHOG_KEY, {
    api_host: process.env.POSTHOG_HOST,
    person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
  });
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
