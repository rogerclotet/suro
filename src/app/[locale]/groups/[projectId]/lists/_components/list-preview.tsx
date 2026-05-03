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

  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/lists/[listId]",
        params: { projectId: list.projectId, listId: list.id },
      }}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-[12px] border border-transparent bg-card transition-colors hover:border-border hover:bg-accent",
          compact ? "px-3 py-[10px]" : "px-4 py-[14px]",
          completed && compact && "opacity-50",
        )}
      >
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

          {list.event && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarFold size={11} />
              {list.event.startAt.toLocaleString(locale, {
                dateStyle: "medium",
              })}
            </div>
          )}
        </div>

        {todoCount > 0 ? (
          <div className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-secondary px-1.5 font-bold text-secondary-foreground text-xs">
            {todoCount}
          </div>
        ) : completed && compact ? (
          <CheckIcon size={18} className="shrink-0 text-primary" />
        ) : null}
      </div>
    </Link>
  );
}

export function ListPreviewSkeleton() {
  return <Skeleton className="h-[58px] w-full rounded-[12px] bg-card" />;
}
