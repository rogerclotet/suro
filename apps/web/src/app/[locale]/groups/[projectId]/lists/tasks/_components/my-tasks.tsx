"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { adaptTask, type TaskWithList } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/user-avatar";
import { Link } from "@/i18n/navigation";
import { DueChip } from "../../[listId]/_components/list-item/due-chip";
import { PriorityBadge } from "../../[listId]/_components/list-item/priority-badge";

type Bucket = "overdue" | "today" | "upcoming" | "noDate";

const BUCKET_ORDER: Bucket[] = ["overdue", "today", "upcoming", "noDate"];

/**
 * The "My tasks" agenda: the current user's incomplete assigned tasks across the
 * project's task lists (sorted server-side), grouped client-side into
 * Overdue / Today / Upcoming / No date against the local day boundary.
 */
export default function MyTasks({ projectId }: { projectId: string }) {
  const t = useTranslations("lists");
  const { project } = useProjects();
  const tasks = useQuery(api.tasks.myTasks, {
    projectId: projectId as Id<"projects">,
  });

  const buckets = useMemo(() => {
    if (!tasks) {
      return null;
    }
    const adapted = tasks.map(adaptTask);
    const todayIndex = localDayIndex(new Date());
    const grouped: Record<Bucket, TaskWithList[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
    };
    for (const task of adapted) {
      grouped[bucketFor(task, todayIndex)].push(task);
    }
    return grouped;
  }, [tasks]);

  if (buckets === null) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const total = BUCKET_ORDER.reduce((sum, key) => sum + buckets[key].length, 0);
  if (total === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{t("myTasksEmpty")}</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {BUCKET_ORDER.filter((key) => buckets[key].length > 0).map((key) => (
        <section key={key}>
          <h2 className="px-4 pt-4 pb-1 text-muted-foreground text-xs uppercase tracking-wider">
            {t(`taskBucket_${key}`)}
          </h2>
          <div className="divide-y divide-border">
            {buckets[key].map((task) => {
              const assignee = task.assigneeId
                ? project?.users.find((u) => u.user.id === task.assigneeId)
                    ?.user
                : undefined;
              return (
                <Link
                  key={task.id}
                  href={{
                    pathname: "/groups/[projectId]/lists/[listId]",
                    params: { projectId, listId: task.listId },
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted"
                >
                  <div className="grow overflow-hidden">
                    <p className="truncate">{task.name}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {task.listName}
                    </p>
                  </div>
                  {task.dueAt && (
                    <DueChip
                      dueAt={task.dueAt}
                      allDay={task.dueAllDay}
                      completed={false}
                    />
                  )}
                  {task.priority && <PriorityBadge priority={task.priority} />}
                  {assignee && (
                    <UserAvatar user={assignee} className="h-6 w-6" />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** The local calendar day a task falls on, as a day index (see `localDayIndex`). */
function bucketFor(task: TaskWithList, todayIndex: number): Bucket {
  if (!task.dueAt) {
    return "noDate";
  }
  const dayIndex = task.dueAllDay
    ? utcDayIndex(task.dueAt)
    : localDayIndex(task.dueAt);
  if (dayIndex < todayIndex) {
    return "overdue";
  }
  if (dayIndex === todayIndex) {
    return "today";
  }
  return "upcoming";
}

/** Whole-day index of a local date (days since the local epoch). */
function localDayIndex(date: Date): number {
  return Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() /
      86_400_000,
  );
}

/**
 * Whole-day index of an all-day due (stored at UTC midnight), read from its UTC
 * parts so it lands on the intended calendar day regardless of timezone.
 */
function utcDayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000,
  );
}
