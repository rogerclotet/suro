"use client";

import type { List } from "@/app/_data/list";
import type { Category } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";
import { Check } from "lucide-react";
import React from "react";
import * as v from "valibot";
import { updateListItemCategory } from "./actions";
import CategorySelector from "./categories/category-selector";
import { listItemSchema } from "./data";

export default function ListItem(props: {
  list: List;
  id: string;
  name: string;
  completed: boolean;
  onChange: (name: string, completed: boolean) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = React.useState(props.name);
  const [completed, setCompleted] = React.useState(props.completed ?? false);
  const { project } = useSelectedProject();

  function save(name: string, completed: boolean) {
    if (!hasChanged(name, completed)) {
      return;
    }

    if (name === "") {
      props.onDelete?.();
      return;
    }

    try {
      const parsed = v.parse(listItemSchema, { name, completed });

      props.onChange(parsed.name, parsed.completed);
    } catch (e) {
      console.error(e);
      return;
    }
  }

  function handleCompletedChange() {
    save(name, !completed);
    setCompleted((prev) => !prev);
  }

  function handleNameChange() {
    save(name, completed);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save(name, completed);
  }

  function hasChanged(name: string, completed: boolean) {
    return name !== props.name || completed !== props.completed;
  }

  async function handleCategorySelected(category: Category) {
    await updateListItemCategory(props.list, props.id, category);
  }

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-grow items-center gap-2"
      >
        <div className="input input-ghost flex w-full items-center gap-4 has-[input[disabled]]:border-transparent has-[input[disabled]]:bg-transparent has-[input[disabled]]:text-neutral-content">
          <input
            type="checkbox"
            className="checkbox"
            checked={completed}
            onChange={handleCompletedChange}
          />
          <input
            type="text"
            disabled={completed}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameChange}
            className={`h-full w-full ${completed && "text-base-content line-through opacity-60"}`}
          />
          {name !== props.name && (
            <button className="btn btn-circle btn-ghost btn-sm">
              <Check />
            </button>
          )}
        </div>
      </form>

      <CategorySelector onSelect={handleCategorySelected} />
    </li>
  );
}
