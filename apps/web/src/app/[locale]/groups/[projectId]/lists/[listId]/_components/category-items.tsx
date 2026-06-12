"use client";

import { useDroppable } from "@dnd-kit/core";
import { type CSSProperties, memo } from "react";
import type { List } from "@/app/_data/list";
import { useStableAutoAnimate } from "@/lib/use-stable-auto-animate";
import { cn } from "@/lib/utils";
import InlineAddItem from "./list-item/inline-add-item";
import ListItem from "./list-item/list-item";

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
  addActive: boolean;
  onAddActivate: (category: string | null) => void;
  onAddDeactivate: (category: string | null) => void;
  onAddSubmitted: (category: string | null) => void;
}) {
  const animationParent = useStableAutoAnimate<HTMLUListElement>();
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
          // Drop placeholder for an emptied section; it (re)appears via a
          // display toggle when a drag starts, which restarts the fade-in.
          <div className="mb-2 h-10 animate-in rounded-md border-2 border-border border-dashed duration-300 fade-in" />
        )}
      </ul>

      {/* Items created here go straight to this category; the no-category
          bucket's entry point is the always-visible form at the top. */}
      {props.category !== "" && (
        <InlineAddItem
          list={props.list}
          category={props.category}
          active={props.addActive}
          onActivate={() => props.onAddActivate(props.category)}
          onDeactivate={() => props.onAddDeactivate(props.category)}
          onSubmitted={props.onAddSubmitted}
        />
      )}
    </div>
  );
});
