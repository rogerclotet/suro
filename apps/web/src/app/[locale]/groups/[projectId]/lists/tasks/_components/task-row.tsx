"use client";

import type { TaskWithList } from "@/app/_data/list";
import type { ProjectMember } from "@/app/_data/project";
import UserAvatar from "@/components/user-avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DueChip } from "../../[listId]/_components/list-item/due-chip";
import { PriorityBadge } from "../../[listId]/_components/list-item/priority-badge";

/** One of My Tasks, linking to its list. */
export function TaskRow({
  projectId,
  task,
  assignee,
  className,
}: {
  projectId: string;
  task: TaskWithList;
  assignee?: ProjectMember["user"];
  className?: string;
}) {
  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/lists/[listId]",
        params: { projectId, listId: task.listId },
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-accent",
        className,
      )}
    >
      <div className="grow overflow-hidden">
        <p className="truncate">{task.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {task.listName}
        </p>
      </div>
      {task.dueAt && (
        <DueChip dueAt={task.dueAt} allDay={task.dueAllDay} completed={false} />
      )}
      {task.priority && <PriorityBadge priority={task.priority} />}
      {assignee && <UserAvatar user={assignee} className="h-6 w-6" />}
    </Link>
  );
}
