"use client";

import type { List } from "@/app/_data/list";
import { useSelectedProject } from "@/app/_state/project-state";
import { Check, Plus } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import * as v from "valibot";
import { createListItem } from "./actions";
import { listItemSchema } from "./data";

export default function NewListItem({ list }: { list: List }) {
  const [name, setName] = React.useState("");
  const { project } = useSelectedProject();

  async function save() {
    if (name === "") {
      return;
    }

    try {
      const parsed = v.parse(listItemSchema, { name, completed: false });
      await createListItem(list, parsed.name, false);
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

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-grow items-center gap-2"
      >
        <div className="input input-ghost flex w-full items-center gap-4 has-[input[disabled]]:border-transparent has-[input[disabled]]:bg-transparent has-[input[disabled]]:text-neutral-content">
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
        </div>
      </form>

      <select className="select select-bordered">
        <option value="">Sense categoria</option>
        {project?.categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </li>
  );
}
