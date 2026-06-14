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
    category: string | null,
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
      props.item.category,
    );
  }

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
            // The strike-through is always present and fades in/out via
            // text-decoration-color (covered by transition-colors), which
            // animates per line box so wrapped names stay struck correctly.
            className={cn(
              "wrap-break-word grow overflow-hidden text-left line-through transition-colors duration-300",
              props.item.completed
                ? "text-muted-foreground decoration-current"
                : "decoration-transparent",
            )}
          >
            {props.item.name}
            {props.item.details ? (
              <span className="block text-muted-foreground text-xs">
                {props.item.details}
              </span>
            ) : null}
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
