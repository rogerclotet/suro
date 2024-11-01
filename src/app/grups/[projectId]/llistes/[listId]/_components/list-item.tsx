"use client";

import type { List } from "@/app/_data/list";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import React from "react";
import EditingListItem from "./editing-list-item";

export default function ListItem(props: {
  list: List;
  id: string;
  name: string;
  categoryId: string | null;
  completed: boolean;
  onChange: (
    name: string,
    completed: boolean,
    categoryId: string | null,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${props.id}`,
    data: { id: props.id },
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  async function handleCheckedChange(checked: boolean) {
    await props.onChange(props.name, checked, props.categoryId);
  }

  if (editing) {
    return (
      <EditingListItem
        list={props.list}
        id={props.id}
        name={props.name}
        completed={props.completed}
        categoryId={props.categoryId}
        onChange={props.onChange}
        onDelete={props.onDelete}
        onBlur={() => setEditing(false)}
      />
    );
  }

  return (
    <li
      className="flex h-10 touch-manipulation flex-row items-center gap-5"
      onClick={() => setEditing(!props.completed)}
      ref={setNodeRef}
      style={style}
    >
      <Checkbox
        checked={props.completed}
        onCheckedChange={handleCheckedChange}
        className="h-5 w-5 transition-all"
        onClick={(e) => e.stopPropagation()}
      />

      <span
        className={cn(
          "flex-grow",
          props.completed ? "text-muted-foreground line-through" : "",
        )}
      >
        {props.name}
      </span>

      <div
        onClick={(e) => e.stopPropagation()}
        className="py-2 pl-2 text-muted-foreground"
        {...listeners}
        {...attributes}
      >
        <GripVertical />
      </div>
    </li>
  );
}
