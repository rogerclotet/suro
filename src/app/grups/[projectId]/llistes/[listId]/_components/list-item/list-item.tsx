"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import type { List, ListItem as ListItemType } from "@/app/_data/list";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import EditListItemForm from "./edit-list-item-form";

export default function ListItem(props: {
  list: List;
  item: ListItemType;
  onChange: (
    name: string,
    details: string,
    completed: boolean,
    categoryId: string | null,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `draggable-${props.item.id}`,
      data: { id: props.item.id },
    });
  const style = transform
    ? {
        transform: `translate3d(0, ${transform.y}px, 0)`,
      }
    : undefined;

  async function handleCheckedChange(checked: boolean) {
    await props.onChange(
      props.item.name,
      props.item.details ?? "",
      checked,
      props.item.categoryId,
    );
  }

  return (
    <li
      className={cn(
        "z-0 flex cursor-pointer touch-manipulation flex-row items-start gap-5 rounded-lg p-2 hover:bg-muted",
        isDragging && "z-50",
      )}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      }}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex flex-row items-center">
        <Checkbox
          checked={props.item.completed ?? false}
          onCheckedChange={handleCheckedChange}
          className="h-6 w-6 transition-all"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <EditListItemForm
        list={props.list}
        item={props.item}
        onChange={props.onChange}
        onDelete={props.onDelete}
        trigger={
          <button
            type="button"
            className={cn(
              "wrap-anywhere grow",
              props.item.completed ? "text-muted-foreground line-through" : "",
            )}
          >
            {props.item.name}
          </button>
        }
      />

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
