import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getNotificationsForUser } from "@/server/notifications";
import NotificationList from "./_components/notification-list";

export default async function NotificacionsPage() {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  const notifications = await getNotificationsForUser(session.user.id);

  return (
    <div className="space-y-4">
      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
