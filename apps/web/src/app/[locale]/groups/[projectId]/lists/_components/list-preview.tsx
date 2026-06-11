"use client";

import { CalendarFold } from "lucide-react";
import { useLocale } from "next-intl";
import type { List } from "@/app/_data/list";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import ProgressRing from "./progress-ring";

/**
 * One row of the lists overview, mirroring the mobile row: name (muted once
 * everything is done) with an optional one-line description, and the
 * completion ring trailing.
 */
export default function ListPreview({ list }: { list: List }) {
  const locale = useLocale();
  const total = list.items.length;
  const pending = list.items.filter((item) => !item.completed).length;
  const done = total - pending;
  const completed = total > 0 && pending === 0;

  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/lists/[listId]",
        params: { projectId: list.projectId, listId: list.id },
      }}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-border/50"
    >
      <div className="min-w-0 flex-1">
        {/* Done lists recede: muted name, faded ring. */}
        <div
          className={cn(
            "truncate text-base",
            completed && "text-muted-foreground",
          )}
        >
          {list.name}
        </div>

        {list.description && (
          <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
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

      <ProgressRing done={done} pending={pending} total={total} />
    </Link>
  );
}

export function ListPreviewSkeleton() {
  return <Skeleton className="h-[54px] w-full rounded-none" />;
}
