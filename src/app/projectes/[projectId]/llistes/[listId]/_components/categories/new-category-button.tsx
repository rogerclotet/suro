"use client";

import { useSelectedProject } from "@/app/_state/project-state";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createCategory } from "./actions";
import { categorySchema } from "./data";

export default function NewCategoryButton() {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const { project, addCategory } = useSelectedProject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(categorySchema),
  });

  async function onSubmit(data: v.InferInput<typeof categorySchema>) {
    dialog.current?.close();
    reset();

    try {
      if (!project) {
        throw new Error("No project selected");
      }

      const categoryId = await createCategory(project, data);
      addCategory({
        id: categoryId,
        name: data.name,
        projectId: project.id,
      });

      toast.success(`Categoria ${data.name} creada`);
    } catch (error) {
      console.error(error);
      toast.error(
        "No s'ha pogut crear la categoria, torna-ho a provar més tard",
      );
    }
  }

  return (
    <div>
      <button
        onClick={() => dialog.current?.showModal()}
        className="flex flex-row flex-nowrap items-center justify-start gap-2 text-nowrap"
      >
        <Plus size={20} /> Nova categoria
      </button>

      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Nova categoria</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control w-full">
              <div className="label label-text">Nom</div>
              <input
                {...register("name")}
                className="input input-bordered w-full"
              />
              {errors.name && (
                <div className="label w-full">
                  <div className="label label-text-alt text-error">
                    {errors.name.message}
                  </div>
                </div>
              )}
            </label>
            <div className="modal-action">
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="btn btn-neutral"
              >
                Cancel·lar
              </button>
              <button className="btn btn-primary">Crear</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
