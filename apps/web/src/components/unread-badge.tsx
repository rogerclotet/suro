"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** An unread count pill, matching the mobile badge. Renders nothing at zero. */
export function UnreadBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const t = useTranslations("notifications");
  if (!count) return null;
  return (
    <span
      role="status"
      aria-label={t("unreadCount", { count })}
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] leading-none font-bold text-primary-foreground tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Marks a row whose item changed since the user last opened it. */
export function UnreadDot({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const t = useTranslations("notifications");
  if (!count) return null;
  return (
    <span
      role="status"
      aria-label={t("unreadCount", { count })}
      className={cn("size-2 shrink-0 rounded-full bg-primary", className)}
    />
  );
}
