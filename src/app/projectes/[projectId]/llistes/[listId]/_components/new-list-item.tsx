"use client";

import type { List } from "@/app/_data/list";
import type { Category } from "@/app/_data/project";
import { useSelectedProject } from "@/app/_state/project-state";
import { Check, Plus } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import * as v from "valibot";
import { createListItem } from "./actions";
import NewCategoryDialog from "./categories/new-category-dialog";
import { listItemSchema } from "./data";

export default function NewListItem({ list }: { list: List }) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<Category>();
  const { project } = useSelectedProject();
  const newCategoryDialog = React.useRef<HTMLDialogElement>(null);

  async function save() {
    if (name === "") {
      return;
    }

    try {
      const parsed = v.parse(listItemSchema, { name, completed: false });
      await createListItem(list, parsed.name, false, category);
      setName("");
    } catch (e) {
      console.error(e);
      toast.error("No s'ha pogut crear l'element, torna-ho a provar més tard");
      return;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await save();
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "new") {
      newCategoryDialog.current?.showModal();
      return;
    }

    setCategory(project?.categories.find((c) => c.id === e.target.value));
  }

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-grow items-center gap-2"
      >
        <label className="input input-ghost flex w-full items-center gap-4 has-[input[disabled]]:border-transparent has-[input[disabled]]:bg-transparent has-[input[disabled]]:text-neutral-content">
          <Plus />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Afegir element"
            className="input-bordered h-full w-full"
          />
          {name !== "" && (
            <button className="btn btn-circle btn-ghost btn-sm">
              <Check />
            </button>
          )}
        </label>
      </form>

      <select
        value={category ? category.id : ""}
        onChange={handleCategoryChange}
        className="select select-bordered max-w-28 sm:max-w-48"
      >
        <option value="">Sense categoria</option>
        {project?.categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
        <option value="new">+ Nova categoria</option>
      </select>

      <NewCategoryDialog
        ref={newCategoryDialog}
        onClose={() => newCategoryDialog.current?.close()}
      />
    </li>
  );
}
