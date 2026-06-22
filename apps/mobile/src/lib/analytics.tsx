import { api } from "backend/convex/_generated/api";
import { useSegments } from "expo-router";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { type ReactNode, useEffect, useRef } from "react";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

/**
 * Wraps the app in PostHog when a key is configured, else renders children
 * untouched so local dev (or any build without analytics keys) still runs.
 * Mirrors the web's posthog-js setup: EU project, app-lifecycle autocapture,
 * and JS error tracking (the web's `capture_exceptions`). Screen views and user
 * identification are handled by `AnalyticsBridge`.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }
  return (
    <PostHogProvider
      apiKey={POSTHOG_KEY}
      options={{
        host: POSTHOG_HOST,
        // App opened/installed/updated/backgrounded — the mobile engagement
        // baseline (default true; explicit for clarity).
        captureAppLifecycleEvents: true,
        // Report uncaught JS errors and unhandled promise rejections. Native
        // (iOS/Android) crashes additionally need the `@posthog/react-native-
        // plugin` config plugin (see app.config.ts) + `nativeCrashes: true`.
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
          },
        },
      }}
      autocapture={{
        // expo-router can't be screen-autocaptured (it doesn't expose a
        // NavigationContainer); `AnalyticsBridge` captures `$screen` manually.
        captureScreens: false,
        captureTouches: false,
      }}
    >
      {children}
    </PostHogProvider>
  );
}

/**
 * Identifies the signed-in user so mobile, web, and server events merge onto one
 * PostHog person keyed by the Convex user id, and captures a `$screen` event on
 * every expo-router navigation. Renders nothing; mounts inside the Convex
 * providers (for `api.users.me`) and inside `AnalyticsProvider` (for
 * `usePostHog`). No-ops when analytics is unconfigured.
 */
export function AnalyticsBridge(): null {
  const posthog = usePostHog();
  const { isAuthenticated } = useAuthGate();
  const me = usePersistentQuery(api.users.me, isAuthenticated ? {} : "skip");
  const segments = useSegments();
  const wasIdentified = useRef(false);

  useEffect(() => {
    if (!posthog) {
      return;
    }
    if (isAuthenticated && me) {
      const traits: Record<string, string> = {};
      if (me.email) {
        traits.email = me.email;
      }
      if (me.name) {
        traits.name = me.name;
      }
      posthog.identify(me._id, traits);
      wasIdentified.current = true;
    } else if (wasIdentified.current && !isAuthenticated) {
      // Sign-out: drop the identity so the next account starts anonymous.
      posthog.reset();
      wasIdentified.current = false;
    }
  }, [posthog, isAuthenticated, me]);

  useEffect(() => {
    if (!posthog) {
      return;
    }
    // `useSegments` yields the route template (e.g. "(app)/[projectId]/lists"),
    // keeping screen names low-cardinality rather than per-id resolved paths.
    void posthog.screen(segments.join("/") || "index");
  }, [posthog, segments]);

  return null;
}
