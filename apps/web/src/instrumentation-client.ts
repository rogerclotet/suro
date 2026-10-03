import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { sentryOptions } from "@/lib/sentry-options";
import { env } from "./env";

posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2025-05-24",
  person_profiles: "identified_only",
  capture_exceptions: false,
  debug: false,
});

Sentry.init(sentryOptions);
