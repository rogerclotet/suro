"use server";

import { auth } from "@/auth";
import { markAllAsRead, markNotificationAsRead } from "@/server/notifications";

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await markNotificationAsRead(notificationId, session.user.id);
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await markAllAsRead(session.user.id);
}
