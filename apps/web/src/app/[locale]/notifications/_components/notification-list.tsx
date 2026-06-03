"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useNotifications } from "@/app/_state/notification-state";
import { Button } from "@/components/ui/button";
import type { getNotificationsForUser } from "@/server/notifications";
import { markAllNotificationsRead, markNotificationRead } from "./actions";
import NotificationItem from "./notification-item";

type Notification = Awaited<ReturnType<typeof getNotificationsForUser>>[number];

export default function NotificationList({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { decrementSection, clearAll } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("notifications");

  const unread = initialNotifications.filter((n) => !n.isRead);
  const read = initialNotifications.filter((n) => n.isRead);

  // Group by project
  function groupByProject(notifications: Notification[]) {
    const groups = new Map<
      string,
      { projectName: string; projectColor: string; items: Notification[] }
    >();

    for (const n of notifications) {
      const existing = groups.get(n.projectId);
      if (existing) {
        existing.items.push(n);
      } else {
        groups.set(n.projectId, {
          projectName: n.projectName,
          projectColor: n.projectColor ?? "blue",
          items: [n],
        });
      }
    }

    return Array.from(groups.values());
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      clearAll();
      await queryClient.invalidateQueries({
        queryKey: ["notification-unread-counts"],
      });
      router.refresh();
    });
  }

  function handleNotificationClick(notification: Notification) {
    startTransition(async () => {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
        decrementSection(notification.section);
        await queryClient.invalidateQueries({
          queryKey: ["notification-unread-counts"],
        });
      }
      if (notification.path) {
        router.push(notification.path);
      }
    });
  }

  const unreadGroups = groupByProject(unread);
  const readGroups = groupByProject(read);

  if (initialNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {unread.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-lg">{t("unread")}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="text-muted-foreground"
            >
              <CheckCheckIcon className="mr-1.5 size-4" />
              {t("markAllRead")}
            </Button>
          </div>

          <div className="space-y-4">
            {unreadGroups.map((group) => (
              <div key={group.projectName}>
                <h3 className="mb-1.5 px-1 font-medium text-muted-foreground text-sm">
                  {group.projectName}
                </h3>
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-lg text-muted-foreground">
            {t("read")}
          </h2>

          <div className="space-y-4">
            {readGroups.map((group) => (
              <div key={group.projectName}>
                <h3 className="mb-1.5 px-1 font-medium text-muted-foreground text-sm">
                  {group.projectName}
                </h3>
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
