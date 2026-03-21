"use client";

import {
  Calendar,
  FileTextIcon,
  FolderOpen,
  GiftIcon,
  HandCoins,
  ListTodo,
  Upload,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { getNotificationsForUser } from "@/server/notifications";

type Notification = Awaited<ReturnType<typeof getNotificationsForUser>>[number];

const typeIcons: Record<string, React.ReactNode> = {
  list_created: <ListTodo className="size-4" />,
  event_created: <Calendar className="size-4" />,
  note_created: <FileTextIcon className="size-4" />,
  spending_created: <HandCoins className="size-4" />,
  pot_created: <HandCoins className="size-4" />,
  template_created: <ListTodo className="size-4" />,
  file_uploaded: <Upload className="size-4" />,
  member_joined: <UserPlus className="size-4" />,
  member_left: <UserMinus className="size-4" />,
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "ara";
  if (diffMinutes < 60) return `fa ${diffMinutes}m`;
  if (diffHours < 24) return `fa ${diffHours}h`;
  if (diffDays < 30) return `fa ${diffDays}d`;
  return date.toLocaleDateString("ca-ES", { dateStyle: "short" });
}

export default function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const icon = typeIcons[notification.type] ?? (
    <FolderOpen className="size-4" />
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          !notification.isRead
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            !notification.isRead ? "font-medium" : "text-muted-foreground",
          )}
        >
          {notification.body}
        </p>
        <p className="mt-0.5 text-muted-foreground text-xs">
          {formatTimeAgo(new Date(notification.createdAt))}
        </p>
      </div>

      {!notification.isRead && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}
