"use client";

import { useTranslations } from "next-intl";
import type { ItemPriority } from "@/app/_data/list";
import { Badge } from "@/components/ui/badge";

// "normal" is the default and renders nothing, so only low/high stand out.
const PRIORITY_VARIANT: Record<
  Exclude<ItemPriority, "normal">,
  "destructive" | "secondary"
> = {
  high: "destructive",
  low: "secondary",
};

/** Small badge for a task's priority; `normal` (the default) is unbadged. */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: ItemPriority;
  className?: string;
}) {
  const t = useTranslations("lists");

  if (priority === "normal") {
    return null;
  }

  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className={className}>
      {t(`priority_${priority}`)}
    </Badge>
  );
}
