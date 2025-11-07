self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();
  const { title, body, tag, icon, badge, image, timestamp, path } = payload;

  const notificationTitle = title ?? "Família";
  const notificationOptions = {
    body,
    tag,
    icon: icon ?? `${self.location.origin}/favicon.png`,
    badge: badge ?? `${self.location.origin}/favicon.png`,
    image,
    timestamp,
    data: {
      path,
    },
  };

  event.waitUntil(
    self.registration
      .showNotification(notificationTitle, notificationOptions)
      .catch((err) => {
        console.error("Failed to show notification", err);
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data.path ?? "/";
  event.waitUntil(clients.openWindow(url));
});
