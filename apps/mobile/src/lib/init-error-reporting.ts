import * as Sentry from "@sentry/react-native";
import { anonymousError } from "error-reporting";
import * as Application from "expo-application";
import Constants from "expo-constants";

const reportingEnabled =
  !__DEV__ &&
  process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT === "production" &&
  !!process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  release: Constants.expoConfig?.extra?.sentryRelease,
  dist: Application.nativeBuildVersion ?? undefined,
  environment: "production",
  enabled: reportingEnabled,
  sendDefaultPii: false,
  maxBreadcrumbs: 0,
  tracesSampleRate: 0,
  enableAutoSessionTracking: false,
  enableNative: reportingEnabled,
  // AppDelegate/MainApplication initialize native capture before JS starts.
  // Do not reinitialize it here and overwrite the native event filters.
  autoInitializeNativeSdk: false,
  enableLogs: false,
  beforeSend: anonymousError,
});
