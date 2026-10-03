import { anonymousError } from "error-reporting";

export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  environment: "production",
  enabled:
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production" &&
    !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  maxBreadcrumbs: 0,
  tracesSampleRate: 0,
  autoSessionTracking: false,
  beforeSend: anonymousError,
};
