import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import type * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useTranslations } from "@/i18n";
import { withOverflowPrefix } from "@/lib/group-paths";

// expo-notifications eagerly registers a device-push-token listener at *import*
// time (its DevicePushTokenAutoRegistration.fx side-effect module), and that
// listener throws on Android in Expo Go — SDK 53 removed remote push from Expo
// Go. So we must never even import the module there: a static import alone would
// throw and take down every screen that imports this file ("missing default
// export" / "Cannot read ErrorBoundary of undefined"). We keep the static import
// type-only (erased at runtime) and `require` the real module lazily, only where
// push can actually work. `isRunningInExpoGo()` is the exact signal
// expo-notifications uses internally to decide whether to throw.
const PUSH_AVAILABLE = Platform.OS !== "web" && !isRunningInExpoGo();

/** The real expo-notifications module. Only call when `PUSH_AVAILABLE`. */
function notifications(): typeof Notifications {
  return require("expo-notifications") as typeof Notifications;
}

// Configure the foreground handler exactly once, lazily. This must NOT run at
// module-load time: importing expo-notifications fires its native init side
// effects, and on a standalone Android build (no Expo Go to short-circuit it)
// that runs at app launch — before any screen mounts — taking the whole app
// down if anything in that path throws. Deferring it behind the hook's effect
// keeps the cost off the launch path and out of the import graph's hot section.
let handlerConfigured = false;
function configureForegroundHandler(): void {
  if (handlerConfigured || !PUSH_AVAILABLE) {
    return;
  }
  handlerConfigured = true;
  // Show the banner even when the app is foregrounded (server pushes are about
  // other members' activity, so they're worth surfacing in-app too).
  notifications().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// getDeviceToken already swallows its own errors; the response-listener effect
// wraps these calls in try/catch. Keeping that boundary at the call sites (not
// here) means a failed configure still flips `handlerConfigured`, so we don't
// retry a known-broken native module on every mount.

/** The EAS project id, required by getExpoPushTokenAsync. Absent until `eas init`. */
function easProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

/**
 * One Android notification channel per app section. The OS exposes each channel
 * as its own toggle, so a member can mute a single category (e.g. expenses)
 * without silencing the rest. The ids are the `channelId`s the backend stamps
 * onto each push (packages/backend/convex/push.ts) — keep the two lists in sync.
 * iOS has no channels, so channel setup is a no-op there.
 */
const ANDROID_CHANNELS = [
  "events",
  "lists",
  "notes",
  "templates",
  "files",
  "members",
  "expenses",
] as const;
type AndroidChannel = (typeof ANDROID_CHANNELS)[number];

/**
 * Register the per-section Android channels, naming each in the user's language.
 * Idempotent: re-running refreshes the localized names (Android keeps a channel's
 * importance fixed once created, but name/description stay editable). Also retires
 * the single catch-all "default" channel earlier builds created. Never throws —
 * push is a best-effort enhancement.
 */
function configureAndroidChannels(
  name: (channel: AndroidChannel) => string,
): void {
  if (!PUSH_AVAILABLE || Platform.OS !== "android") {
    return;
  }
  try {
    const N = notifications();
    void N.deleteNotificationChannelAsync("default").catch(() => {});
    for (const channel of ANDROID_CHANNELS) {
      void N.setNotificationChannelAsync(channel, {
        name: name(channel),
        importance: N.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }
  } catch {
    // expo-notifications' native side failed to init; ignore (push is optional).
  }
}

/**
 * The outcome of a token fetch. On failure it carries a `reason` instead of a
 * bare null, so the caller can log *why* a real signed-in device produced no
 * token — the failure was otherwise swallowed, leaving prod issues (e.g. a
 * device whose FCM registration throws) undiagnosable without a debugger.
 */
type TokenResult = { token: string } | { token: null; reason: string };

/**
 * Fetch this device's Expo push token, requesting permission if needed. Never
 * throws; returns a reason when push can't work here: a simulator, Expo Go, the
 * web, a denied permission, before EAS is configured, or a native FCM/APNs error.
 */
async function getDeviceToken(): Promise<TokenResult> {
  if (!PUSH_AVAILABLE) {
    return { token: null, reason: "push-unavailable" };
  }
  try {
    if (!Device.isDevice) {
      return { token: null, reason: "not-a-physical-device" };
    }
    const projectId = easProjectId();
    if (!projectId) {
      return { token: null, reason: "missing-eas-project-id" };
    }
    const N = notifications();
    const current = await N.getPermissionsAsync();
    const status =
      current.status === "granted"
        ? "granted"
        : (await N.requestPermissionsAsync()).status;
    if (status !== "granted") {
      return { token: null, reason: `permission-${status}` };
    }
    const { data } = await N.getExpoPushTokenAsync({ projectId });
    return { token: data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { token: null, reason: `getExpoPushTokenAsync threw: ${message}` };
  }
}

/** Drop this device's token on sign-out. Best-effort; call while still authed. */
export async function unregisterPushToken(
  unregister: (args: { token: string }) => Promise<null>,
): Promise<void> {
  const { token } = await getDeviceToken();
  if (token) {
    await unregister({ token }).catch(() => {});
  }
}

/**
 * Register this device's push token while signed in, and route notification taps
 * to the right group section. Safe to mount unconditionally — it no-ops when
 * push isn't available. Call once in the authenticated layout.
 */
export function usePushNotifications(): void {
  const { isAuthenticated } = useConvexAuth();
  const register = useMutation(api.pushTokens.register);
  const router = useRouter();
  const t = useTranslations("notifications.channels");

  // Register the Android channels up front (and re-localize them when the locale
  // changes) so server pushes land in the right, individually-mutable category.
  useEffect(() => {
    configureAndroidChannels((channel) => t(channel));
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    // Per auth session: stop re-fetching the token once we've registered it, so
    // the foreground listener below doesn't hit Expo's servers on every resume.
    let registered = false;
    let warned = false;
    function syncToken(): void {
      if (registered) {
        return;
      }
      void getDeviceToken().then((result) => {
        if (cancelled) {
          return;
        }
        if (result.token !== null) {
          registered = true;
          void register({ token: result.token, platform: Platform.OS });
          return;
        }
        // Log only genuine defects (a failed FCM/APNs registration, missing
        // config) — once per session, visible in `adb logcat`, since the
        // failure is otherwise silent and PostHog isn't keyed in this build yet.
        // Skip the expected states: push can't run here, or the user just
        // hasn't granted permission. (An FCM block — e.g. NextDNS filtering
        // Google's endpoints — surfaces here as `getExpoPushTokenAsync threw`.)
        const benign =
          result.reason === "push-unavailable" ||
          result.reason === "not-a-physical-device" ||
          result.reason.startsWith("permission-");
        if (!warned && !benign) {
          warned = true;
          console.warn(`[push] no token registered: ${result.reason}`);
        }
      });
    }
    syncToken();
    // Re-attempt on foreground: a fresh mount is the only other trigger, so a
    // permission granted later in the OS settings (Android 13+ asks at runtime,
    // and a denied prompt never re-asks in-app) would otherwise not register a
    // token until the next cold start. Mirrors OfflineProvider's AppState use.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncToken();
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [isAuthenticated, register]);

  useEffect(() => {
    if (!PUSH_AVAILABLE) {
      return;
    }
    function open(response: Notifications.NotificationResponse) {
      const path = response.notification.request.content.data?.path;
      if (typeof path === "string") {
        // Payloads are built server-side as `/<pid>/<section>` or
        // `/<pid>/<section>/<id>` (the entity the push is about), with no
        // knowledge of the mobile tab layout; nest overflow sections under the
        // More tab.
        router.push(withOverflowPrefix(path));
      }
    }
    // Any of these can throw if expo-notifications' native side fails to init on
    // a misconfigured build; never let that propagate and crash the app — push
    // is a best-effort enhancement, not load-bearing.
    try {
      configureForegroundHandler();
      const N = notifications();
      const subscription = N.addNotificationResponseReceivedListener(open);
      // Cold start: the tap that launched the app isn't delivered to the listener.
      void N.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) {
            open(response);
          }
        })
        .catch(() => {});
      return () => subscription.remove();
    } catch {
      return;
    }
  }, [router]);
}
