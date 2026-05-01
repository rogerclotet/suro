"use client";

import { useDroppable } from "@dnd-kit/core";
import { autoAnimate } from "@formkit/auto-animate";
import { type CSSProperties, memo, useCallback, useRef } from "react";
import type { List } from "@/app/_data/list";
import ListItem from "./list-item/list-item";

// useAutoAnimate fires the callback ref twice in React Strict Mode (dev), creating
// duplicate MutationObservers that cancel each other's FLIP animations. This hook
// prevents double-initialization by tracking the controller and calling destroy() on cleanup.
function useStableAutoAnimate() {
  const controllerRef = useRef<{ destroy?: () => void } | null>(null);
  return useCallback((node: HTMLUListElement | null) => {
    if (node && !controllerRef.current) {
      controllerRef.current = autoAnimate(node) as { destroy?: () => void };
    } else if (!node && controllerRef.current) {
      controllerRef.current?.destroy?.();
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
    categoryId: string | null,
  ) => Promise<void>;
  handleDelete: (item: List["items"][number]) => Promise<void>;
}) {
  const animationParent = useStableAutoAnimate();
  const { isOver, setNodeRef } = useDroppable({
    id: props.category === "" ? "droppable" : `droppable-${props.category}`,
    data: { category: props.category },
  });
  const style: CSSProperties = {
    backgroundColor: isOver ? "rgba(0, 0, 0, 0.2)" : undefined,
    display: props.items.length > 0 || props.isDragging ? "block" : "none",
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-md">
      <h3
        key={`title_${props.category}`}
        className="px-2 font-semibold text-lg"
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
              onChange={(name, details, completed, categoryId) =>
                props.handleChange(item, name, details, completed, categoryId)
              }
              onDelete={() => props.handleDelete(item)}
            />
          ))
        ) : (
          <div className="mb-2 h-10 rounded-md border-2 border-[rgba(255,255,255,0.2)] border-dashed" />
        )}
      </ul>
    </div>
  );
});
