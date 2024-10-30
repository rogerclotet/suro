type NotificationOptions = Parameters<
  ServiceWorkerRegistration["showNotification"]
>[1] & { title?: string };

export async function submitSubscription(subscription: PushSubscription) {
  await fetch("/api/web-push/subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription }),
  });
}

export async function sendPush(
  message: string,
  title?: string,
  path?: string,
): Promise<void> {
  const payload: NotificationOptions = {
    title,
    body: message,
    data: { path: path ?? "/" },
  };

  await fetch("/api/web-push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
