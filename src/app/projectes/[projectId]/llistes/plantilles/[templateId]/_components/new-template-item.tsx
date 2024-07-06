"use client";

import type { Template } from "@/app/_data/list";
import { useSelectedProject } from "@/app/_state/project-state";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import NewCategoryDialog from "../../../[listId]/_components/categories/new-category-dialog";
import { templateItemSchema } from "../../_components/create-template/data";
import { createTemplateItem } from "./actions";

export default function NewTemplateItem({ template }: { template: Template }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = useForm({
    defaultValues: {
      name: "",
      category: "",
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useSelectedProject();
  const newCategoryDialog = React.useRef<HTMLDialogElement>(null);

  async function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    reset({ name: "" });

    try {
      await createTemplateItem(template, data);
    } catch (e) {
      console.error(e);
      toast.error("No s'ha pogut crear l'element, torna-ho a provar més tard");
      return;
    }
  }

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="input input-ghost flex w-full items-center gap-4 has-[input[disabled]]:border-transparent has-[input[disabled]]:bg-transparent has-[input[disabled]]:text-neutral-content">
          <Plus />
          <input
            {...register("name")}
            placeholder="Afegir element"
            className="input-bordered h-full w-full"
          />
          {dirtyFields.name && (
            <button className="btn btn-circle btn-ghost btn-sm">
              <Check />
            </button>
          )}
        </label>
      </form>

      <select
        {...register("category")}
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
