type NotificationOptions = Parameters<
  ServiceWorkerRegistration["showNotification"]
>[1] & { title?: string };

export async function sendPush(message: string, path?: string): Promise<void> {
  const payload: NotificationOptions = {
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
