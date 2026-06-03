export async function submitSubscription(subscription: PushSubscription) {
  await fetch("/api/web-push/subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription }),
  });
}
