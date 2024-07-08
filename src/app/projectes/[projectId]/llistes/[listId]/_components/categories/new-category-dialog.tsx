"use client";

import { useSelectedProject } from "@/app/_state/project-state";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createCategory } from "./actions";
import { categorySchema } from "./data";

type Props = {
  onClose: () => void;
  onCreate?: (categoryId: string) => void;
};

const NewCategoryDialog = forwardRef<HTMLDialogElement, Props>(
  ({ onClose, onCreate }, ref) => {
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
      onClose();
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

        onCreate?.(categoryId);
        toast.success(`Categoria ${data.name} creada`);
      } catch (error) {
        console.error(error);
        toast.error(
          "No s'ha pogut crear la categoria, torna-ho a provar més tard",
        );
      }
    }

    return (
      <dialog ref={ref} className="modal">
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
                onClick={() => onClose()}
                className="btn btn-neutral"
              >
                Cancel·lar
              </button>
              <button className="btn btn-primary">Crear</button>
            </div>
          </form>
        </div>
      </dialog>
    );
  },
);

NewCategoryDialog.displayName = "NewCategoryDialog";

export default NewCategoryDialog;
