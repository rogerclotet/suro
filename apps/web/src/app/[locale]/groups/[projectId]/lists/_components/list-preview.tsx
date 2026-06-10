"use client";

import { CalendarFold, CheckIcon } from "lucide-react";
import { useLocale } from "next-intl";
import type { List } from "@/app/_data/list";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function ListPreview({
  list,
  compact,
}: {
  list: List;
  compact?: boolean;
}) {
  const locale = useLocale();
  const todoCount = list.items.filter((item) => !item.completed).length;
  const completed = list.items.length > 0 && todoCount === 0;
  const totalCount = list.items.length;
  const completedCount = totalCount - todoCount;
  const progress = totalCount > 0 ? completedCount / totalCount : null;

  const itemPreview =
    !compact && !list.description && todoCount > 0
      ? list.items
          .filter((item) => !item.completed)
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ")
      : null;

  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/lists/[listId]",
        params: { projectId: list.projectId, listId: list.id },
      }}
    >
      <div
        className={cn(
          "flex flex-col rounded-[12px] border border-transparent bg-card transition-colors hover:border-border hover:bg-accent",
          compact ? "px-3 py-[10px]" : "px-4 py-[14px]",
          completed && compact && "opacity-50",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "truncate font-semibold",
                compact ? "text-sm" : "text-base",
              )}
            >
              {list.name}
            </div>

            {list.description && (
              <div className="mt-0.5 truncate text-muted-foreground text-xs">
                {list.description}
              </div>
            )}

            {itemPreview && (
              <div className="mt-0.5 truncate text-muted-foreground/70 text-xs">
                {itemPreview}
                {todoCount > 3 && (
                  <span className="ml-1">+{todoCount - 3}</span>
                )}
              </div>
            )}

            {list.event && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarFold size={11} />
                {list.event.startAt.toLocaleString(locale, {
                  dateStyle: "medium",
                })}
              </div>
            )}
          </div>

          {completed && compact && (
            <CheckIcon size={18} className="shrink-0 text-primary" />
          )}
        </div>

        {!compact && progress !== null && (
          <div className="mt-2">
            <div className="text-right font-medium text-muted-foreground text-xs tabular-nums">
              {completedCount}/{totalCount}
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-foreground/25">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  completed ? "bg-primary" : "bg-primary/50",
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export function ListPreviewSkeleton() {
  return <Skeleton className="h-[58px] w-full rounded-[12px] bg-card" />;
}
