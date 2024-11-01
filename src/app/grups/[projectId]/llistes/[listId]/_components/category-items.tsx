import type { List } from "@/app/_data/list";
import { useDroppable } from "@dnd-kit/core";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { CSSProperties } from "react";
import ListItem from "./list-item";

export default function CategoryItems({
  items,
  category,
  list,
  isDragging,
  handleChange,
  handleDelete,
}: {
  items: List["items"];
  category: string;
  list: List;
  isDragging: boolean;
  handleChange: (
    item: List["items"][number],
    name: string,
    completed: boolean,
    categoryId: string | null,
  ) => Promise<void>;
  handleDelete: (item: List["items"][number]) => Promise<void>;
}) {
  const [animationParent] = useAutoAnimate();
  const { isOver, setNodeRef } = useDroppable({
    id: category === "" ? "droppable" : `droppable-${category}`,
    data: { category },
  });
  const style: CSSProperties = {
    backgroundColor: isOver ? "rgba(0, 0, 0, 0.2)" : undefined,
    display: items.length > 0 || isDragging ? "block" : "none",
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-md px-2">
      <h3 key={`title_${category}`} className="text-lg font-semibold">
        {category}
      </h3>
      <ul ref={animationParent}>
        {items.length > 0 ? (
          items.map((item) => (
            <ListItem
              key={item.id}
              list={list}
              id={item.id}
              name={item.name}
              completed={item.completed ?? false}
              categoryId={item.category?.id ?? null}
              onChange={(name, completed, categoryId) =>
                handleChange(item, name, completed, categoryId)
              }
              onDelete={() => handleDelete(item)}
            />
          ))
        ) : (
          <div className="h-10" />
        )}
      </ul>
    </div>
  );
}
