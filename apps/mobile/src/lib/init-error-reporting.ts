import * as Sentry from "@sentry/react-native";
import { anonymousError } from "error-reporting";
import * as Application from "expo-application";
import Constants from "expo-constants";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  release: Constants.expoConfig?.extra?.sentryRelease,
  dist: Application.nativeBuildVersion ?? undefined,
  environment: "production",
  enabled:
    !__DEV__ &&
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT === "production" &&
    !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  maxBreadcrumbs: 0,
  tracesSampleRate: 0,
  enableAutoSessionTracking: false,
  // Native crash payloads bypass the JS privacy filter. Keep the existing JS
  // error coverage until a native beforeSend filter is implemented on both OSes.
  enableNative: false,
  beforeSend: anonymousError,
});
