import posthog from "posthog-js";
import { env } from "./env";

if (process.env.NODE_ENV === "production") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://eu.i.posthog.com",
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    capture_exceptions: true,
    debug: false,
  });
}
