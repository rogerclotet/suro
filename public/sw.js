self.addEventListener("push", function (event) {
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

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
