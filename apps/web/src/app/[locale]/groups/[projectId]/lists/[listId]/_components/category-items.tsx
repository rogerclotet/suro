"use client";

import { useDroppable } from "@dnd-kit/core";
import { type AnimationController, autoAnimate } from "@formkit/auto-animate";
import { type CSSProperties, memo, useCallback, useRef } from "react";
import type { List } from "@/app/_data/list";
import { cn } from "@/lib/utils";
import ListItem from "./list-item/list-item";

// useAutoAnimate fires the callback ref twice in React Strict Mode (dev), creating
// duplicate MutationObservers that cancel each other's FLIP animations. This hook
// prevents double-initialization by tracking the controller and calling destroy() on cleanup.
function useStableAutoAnimate() {
  const controllerRef = useRef<AnimationController | null>(null);
  return useCallback((node: HTMLUListElement | null) => {
    if (node && !controllerRef.current) {
      controllerRef.current = autoAnimate(node);
    } else if (!node && controllerRef.current) {
      controllerRef.current.destroy?.();
      controllerRef.current = null;
    }
  }, []);
}

export default memo(function CategoryItems(props: {
  items: List["items"];
  category: string;
  list: List;
  isDragging: boolean;
  handleChange: (
    item: List["items"][number],
    name: string,
    details: string,
    completed: boolean,
    category: string | null,
  ) => Promise<void>;
  handleDelete: (item: List["items"][number]) => Promise<void>;
}) {
  const animationParent = useStableAutoAnimate();
  const { isOver, setNodeRef } = useDroppable({
    id: props.category === "" ? "droppable" : `droppable-${props.category}`,
    data: { category: props.category },
  });
  const style: CSSProperties = {
    display: props.items.length > 0 || props.isDragging ? "block" : "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Drop target highlights with a faint primary wash, like mobile's
      // category drop zones (`${t.primary}14`).
      className={cn("rounded-md", isOver && "bg-primary/8")}
    >
      <h3
        key={`title_${props.category}`}
        // Muted uppercase micro-header, mirroring mobile's section titles.
        className="px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
      >
        {props.category}
      </h3>

      <ul ref={animationParent}>
        {props.items.length > 0 ? (
          props.items.map((item) => (
            <ListItem
              key={item.id}
              list={props.list}
              item={item}
              onChange={(name, details, completed, category) =>
                props.handleChange(item, name, details, completed, category)
              }
              onDelete={() => props.handleDelete(item)}
            />
          ))
        ) : (
          <div className="mb-2 h-10 rounded-md border-2 border-border border-dashed" />
        )}
      </ul>
    </div>
  );
});
