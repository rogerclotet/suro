"use client";

import type { List } from "@/app/_data/list";
import { valibotResolver } from "@hookform/resolvers/valibot";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { listSchema } from "../../../_components/create-list/data";
import { updateList } from "./actions";

type Props = {
  list: List;
  onClose: () => void;
};

const EditListDialog = React.forwardRef<HTMLDialogElement, Props>(
  ({ list, onClose }, ref) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm({
      defaultValues: {
        name: list.name,
        description: list.description ?? "",
      },
      resolver: valibotResolver(listSchema),
    });

    async function onSubmit(data: v.InferInput<typeof listSchema>) {
      onClose();

      try {
        await updateList(list, data);
        toast.success(`Llista ${data.name} actualitzada`);
      } catch (error) {
        console.error(error);
        toast.error(
          "No s'ha pogut actualitzar la llista, torna-ho a provar més tard",
        );
      }
    }

    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Editar llista</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control w-full">
              <div className="label label-text">Nom</div>
              <input
                {...register("name")}
                className="input input-bordered w-full"
              />
              {errors.name && (
                <div className="label w-full">
                  <span className="label-text-alt text-error">
                    {errors.name.message?.toString()}
                  </span>
                </div>
              )}
            </label>
            <label className="form-control w-full">
              <div className="label label-text">Descripció</div>
              <textarea
                {...register("description")}
                className="textarea textarea-bordered w-full"
              />
              {errors.description && (
                <div className="label w-full">
                  <span className="label-text-alt text-error">
                    {errors.description.message?.toString()}
                  </span>
                </div>
              )}
            </label>
            <div className="modal-action">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-neutral"
              >
                Cancel·lar
              </button>
              <button className="btn btn-primary">Desar</button>
            </div>
          </form>
        </div>
      </dialog>
    );
  },
);

EditListDialog.displayName = "EditListDialog";

export default EditListDialog;
