"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { DUE_BUCKETS, type DueBucket, dueBucket } from "domain/tasks";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { adaptTask, type TaskWithList } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow } from "./task-row";

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
    const now = new Date();
    const grouped: Record<DueBucket, TaskWithList[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
    };
    for (const task of tasks) {
      grouped[dueBucket(task, now)].push(adaptTask(task));
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

  const total = DUE_BUCKETS.reduce((sum, key) => sum + buckets[key].length, 0);
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
      {DUE_BUCKETS.filter((key) => buckets[key].length > 0).map((key) => (
        <section key={key}>
          <h2 className="px-4 pt-4 pb-1 text-xs tracking-wider text-muted-foreground uppercase">
            {t(`taskBucket_${key}`)}
          </h2>
          <div className="divide-y divide-border">
            {buckets[key].map((task) => (
              <TaskRow
                key={task.id}
                projectId={projectId}
                task={task}
                assignee={
                  task.assigneeId
                    ? project?.users.find((u) => u.user.id === task.assigneeId)
                        ?.user
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
