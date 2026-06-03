import { submitSubscription } from "./api/web-push/[...path]/api";

const SERVICE_WORKER_FILE_PATH = "/sw.js";

export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_FILE_PATH, {
      scope: "/",
    });
    await subscribe(onSubscribe);
  } catch (err) {
    console.error("Failed to register service worker", err);
  }
}

export function areNotificationsEnabled() {
  switch (localStorage.getItem("notifications")) {
    case "enabled":
      return true;
    case "disabled":
      return false;
    default:
      return undefined;
  }
}

export function enableNotifications() {
  localStorage.setItem("notifications", "enabled");
}

export function disableNotifications() {
  localStorage.setItem("notifications", "disabled");
}

export function notificationUnsupported(): boolean {
  let unsupported = false;
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("showNotification" in ServiceWorkerRegistration.prototype)
  ) {
    unsupported = true;
  }
  return unsupported;
}

async function subscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription =
      await registration.pushManager.getSubscription();

    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      }));

    // Always submit to server to ensure the subscription is stored,
    // even if the browser already has one (e.g. after a DB reset).
    await submitSubscription(subscription);
    onSubscribe(subscription);
  } catch (err) {
    console.error("Failed to subscribe", err);
  }
}

export async function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  const result = await navigator.permissions.query({
    name: "notifications",
  });
  switch (result.state) {
    case "denied":
      break;
    case "granted":
      await registerAndSubscribe(onSubscribe);
      break;
    case "prompt":
      await registerAndSubscribe(onSubscribe);
      break;
  }
}
