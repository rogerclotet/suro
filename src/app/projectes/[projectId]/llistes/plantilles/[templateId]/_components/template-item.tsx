"use client";

import type { Template } from "@/app/_data/list";
import { useSelectedProject } from "@/app/_state/project-state";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import NewCategoryDialog from "../../../[listId]/_components/categories/new-category-dialog";
import { templateItemSchema } from "../../_components/create-template/data";

export default function TemplateItem({
  item,
  onChange,
}: {
  item: Template["items"][number];
  onChange: (name: string, category: string) => void;
}) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { dirtyFields },
  } = useForm({
    defaultValues: {
      name: item.name,
      category: item.category,
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useSelectedProject();
  const newCategoryDialog = React.useRef<HTMLDialogElement>(null);

  async function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    try {
      onChange(data.name, data.category);
    } catch (e) {
      console.error(e);
      toast.error("No s'ha pogut crear l'element, torna-ho a provar més tard");
      return;
    }
  }

  const { onBlur: onNameBlur, ...registerName } = register("name");

  const { onChange: onCategoryChange, ...registerCategory } =
    register("category");

  async function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    await onNameBlur(e);
    onChange(getValues("name"), item.category);
  }

  async function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "new") {
      newCategoryDialog.current?.showModal();
      return;
    }

    await onCategoryChange(e);
    onChange(item.name, getValues("category"));
  }

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-grow items-center gap-2"
      >
        <label className="input input-ghost flex w-full items-center gap-2 has-[input[disabled]]:border-transparent has-[input[disabled]]:bg-transparent has-[input[disabled]]:text-neutral-content">
          <input
            {...registerName}
            onBlur={handleNameBlur}
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
        {...registerCategory}
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
        onCreate={(categoryId) => onChange(item.name, categoryId)}
      />
    </li>
  );
}
