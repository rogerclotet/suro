"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical, RepeatIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { List, ListItem as ListItemType } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Checkbox } from "@/components/ui/checkbox";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import {
  presetFromRecurrence,
  type TaskMutationArgs,
  taskArgsFromItem,
} from "./data";
import { DueChip } from "./due-chip";
import EditListItemForm from "./edit-list-item-form";
import { PriorityBadge } from "./priority-badge";

export default function ListItem(props: {
  list: List;
  item: ListItemType;
  onChange: (
    name: string,
    details: string,
    completed: boolean,
    category: string | null,
    task: TaskMutationArgs,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { list, item } = props;
  const t = useTranslations("lists");
  const { project } = useProjects();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `draggable-${item.id}`,
      data: { id: item.id },
    });
  const style = transform
    ? {
        transform: `translate3d(0, ${transform.y}px, 0)`,
      }
    : undefined;

  async function handleCheckedChange(checked: boolean) {
    // Forward the item's current task fields: the backend clears any omitted
    // field, so a bare toggle would otherwise wipe due date/assignee/etc.
    await props.onChange(
      item.name,
      item.details ?? "",
      checked,
      item.category,
      taskArgsFromItem(item),
    );
  }

  const assignee = item.assigneeId
    ? project?.users.find((u) => u.user.id === item.assigneeId)?.user
    : undefined;
  const repeat = presetFromRecurrence(item.recurrence);

  return (
    <li
      className={cn(
        "flex cursor-pointer touch-manipulation flex-row items-start gap-5 rounded-lg p-2 hover:bg-muted",
        // `relative` makes the z-index effective: a static li ignores it and
        // paints in DOM order, hiding the dragged row behind later categories.
        isDragging && "relative z-50",
      )}
      onKeyDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (
          (e.key === "Enter" || e.key === " ") &&
          tag !== "INPUT" &&
          tag !== "TEXTAREA" &&
          tag !== "SELECT"
        ) {
          e.preventDefault();
        }
      }}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex flex-row items-center">
        <Checkbox
          checked={item.completed ?? false}
          onCheckedChange={handleCheckedChange}
          className="h-6 w-6 transition-all"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Name (the edit trigger) plus, on task lists, a metadata row beneath it.
          The chips live outside the trigger <button> so block elements like the
          priority badge stay valid HTML. */}
      <div className="grow overflow-hidden">
        <EditListItemForm
          list={list}
          item={item}
          onChange={props.onChange}
          onDelete={props.onDelete}
          trigger={
            <button
              type="button"
              // The strike-through is always present and fades in/out via
              // text-decoration-color (covered by transition-colors), which
              // animates per line box so wrapped names stay struck correctly.
              className={cn(
                "wrap-break-word block w-full overflow-hidden text-left line-through transition-colors duration-300",
                item.completed
                  ? "text-muted-foreground decoration-current"
                  : "decoration-transparent",
              )}
            >
              {item.name}
              {item.details ? (
                <span className="block text-muted-foreground text-xs">
                  {item.details}
                </span>
              ) : null}
            </button>
          }
        />
        {assignee || item.priority || item.dueAt || repeat !== "none" ? (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {assignee && (
              <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                <UserAvatar user={assignee} className="h-5 w-5" />
                {assignee.name}
              </span>
            )}
            {item.priority && <PriorityBadge priority={item.priority} />}
            {item.dueAt && (
              <DueChip
                dueAt={item.dueAt}
                allDay={item.dueAllDay}
                completed={item.completed ?? false}
              />
            )}
            {repeat !== "none" ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                <RepeatIcon className="size-3" />
                {t(`repeat_${repeat}`)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        className="cursor-grab text-muted-foreground"
        {...listeners}
        {...attributes}
      >
        <GripVertical />
      </button>
    </li>
  );
}
