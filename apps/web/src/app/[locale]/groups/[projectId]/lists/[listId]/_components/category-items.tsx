"use client";

import { useDroppable } from "@dnd-kit/core";
import type { RowKeys } from "domain/row-keys";
import { AnimatePresence, useComposedRefs } from "motion/react";
import * as m from "motion/react-m";
import { type CSSProperties, memo, type Ref } from "react";
import type { List } from "@/app/_data/list";
import { droppableSectionPresence } from "@/components/motion/list-transitions";
import { cn } from "@/lib/utils";
import type { TaskMutationArgs } from "./list-item/data";
import InlineAddItem from "./list-item/inline-add-item";
import ListItem from "./list-item/list-item";

export default memo(function CategoryItems(props: {
  items: List["items"];
  category: string;
  rowKeys: RowKeys;
  droppedItemId: string | null;
  onExitComplete: () => void;
  list: List;
  isDragging: boolean;
  handleChange: (
    item: List["items"][number],
    name: string,
    details: string,
    completed: boolean,
    category: string | null,
    task: TaskMutationArgs,
  ) => Promise<void>;
  handleCompleted: (
    item: List["items"][number],
    completed: boolean,
  ) => Promise<void>;
  handleDelete: (item: List["items"][number]) => Promise<void>;
  addActive: boolean;
  onAddActivate: (category: string | null) => void;
  onAddDeactivate: (category: string | null) => void;
  onAddSubmitted: (category: string | null) => void;
  /** Set by AnimatePresence to pop the section out of the flow on exit. */
  ref?: Ref<HTMLDivElement>;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.category === "" ? "droppable" : `droppable-${props.category}`,
    data: { category: props.category },
  });
  const ref = useComposedRefs(setNodeRef, props.ref);
  const style: CSSProperties = {
    display: props.items.length > 0 || props.isDragging ? "block" : "none",
  };

  return (
    <m.div
      ref={ref}
      layout="position"
      {...droppableSectionPresence(props.items.map((item) => item.id))}
      style={style}
      // Drop target highlights with a faint primary wash, like mobile's
      // category drop zones (`${t.primary}14`).
      className={cn("rounded-md", isOver && "bg-primary/8")}
    >
      <h3
        key={`title_${props.category}`}
        // Muted uppercase micro-header, mirroring mobile's section titles.
        className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {props.category}
      </h3>

      {/* `relative` anchors rows that pop out of the flow while they fade
          out, so their siblings close the gap at once. */}
      <ul className="relative">
        <AnimatePresence
          initial={false}
          mode="popLayout"
          custom={props.droppedItemId}
          onExitComplete={props.onExitComplete}
        >
          {props.items.map((item) => (
            <ListItem
              key={props.rowKeys.get(item.id)?.key ?? item.id}
              list={props.list}
              item={item}
              droppedItemId={props.droppedItemId}
              onChange={(name, details, completed, category, task) =>
                props.handleChange(
                  item,
                  name,
                  details,
                  completed,
                  category,
                  task,
                )
              }
              onDelete={() => props.handleDelete(item)}
              onCompleted={(completed) =>
                props.handleCompleted(item, completed)
              }
            />
          ))}
        </AnimatePresence>
        {props.items.length === 0 ? (
          // Drop placeholder for an emptied section; it (re)appears via a
          // display toggle when a drag starts, which restarts the fade-in.
          <div className="mb-2 h-10 animate-in rounded-md border-2 border-dashed border-border duration-300 fade-in" />
        ) : null}
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
    </m.div>
  );
});
