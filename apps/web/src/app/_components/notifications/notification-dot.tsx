"use client";

import { cn } from "@/lib/utils";

export default function NotificationDot({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary",
        className,
      )}
    />
  );
}
