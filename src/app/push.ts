const SERVICE_WORKER_FILE_PATH = "./sw.js";

export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_FILE_PATH);
    await subscribe(onSubscribe);
  } catch (err) {
    console.error("Failed to register service-worker", err);
  }
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
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    console.info("Created subscription object", subscription.toJSON());
    // submit subscription to server.
    await submitSubscription(subscription);
    onSubscribe(subscription);
  } catch (err) {
    console.error("Failed to subscribe", err);
  }
}

async function submitSubscription(
  subscription: PushSubscription,
): Promise<void> {
  const endpointUrl = "/api/web-push/subscription";
  await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription }),
  });
}

export async function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  const notificationPermission = Notification.permission;
  switch (notificationPermission) {
    case "denied":
      break;
    case "granted":
      await registerAndSubscribe(onSubscribe);
      break;
    case "default":
      break;
  }
}
