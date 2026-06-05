import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import type * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

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

if (PUSH_AVAILABLE) {
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

/** The EAS project id, required by getExpoPushTokenAsync. Absent until `eas init`. */
function easProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

/**
 * Fetch this device's Expo push token, requesting permission if needed. Returns
 * null (never throws) when push can't work here: a simulator, Expo Go, the web,
 * a denied permission, or before EAS is configured.
 */
async function getDeviceToken(): Promise<string | null> {
  if (!PUSH_AVAILABLE) {
    return null;
  }
  try {
    if (!Device.isDevice) {
      return null;
    }
    const projectId = easProjectId();
    if (!projectId) {
      return null;
    }
    const N = notifications();
    const current = await N.getPermissionsAsync();
    const status =
      current.status === "granted"
        ? "granted"
        : (await N.requestPermissionsAsync()).status;
    if (status !== "granted") {
      return null;
    }
    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync("default", {
        name: "Default",
        importance: N.AndroidImportance.DEFAULT,
      });
    }
    const { data } = await N.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

/** Drop this device's token on sign-out. Best-effort; call while still authed. */
export async function unregisterPushToken(
  unregister: (args: { token: string }) => Promise<null>,
): Promise<void> {
  const token = await getDeviceToken();
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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    void getDeviceToken().then((token) => {
      if (!cancelled && token) {
        void register({ token, platform: Platform.OS });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, register]);

  useEffect(() => {
    if (!PUSH_AVAILABLE) {
      return;
    }
    const N = notifications();
    function open(response: Notifications.NotificationResponse) {
      const path = response.notification.request.content.data?.path;
      if (typeof path === "string") {
        router.push(path);
      }
    }
    const subscription = N.addNotificationResponseReceivedListener(open);
    // Cold start: the tap that launched the app isn't delivered to the listener.
    void N.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        open(response);
      }
    });
    return () => subscription.remove();
  }, [router]);
}
