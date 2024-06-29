"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createList } from "./actions";
import { createListSchema } from "./data";

export default function CreateListButton({ projectId }: { projectId: string }) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    resolver: valibotResolver(createListSchema),
  });
  const dialog = React.useRef<HTMLDialogElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  async function onSubmit(data: v.InferInput<typeof createListSchema>) {
    setIsLoading(true);
    try {
      const listId = await createList(projectId, data);
      toast.success(`Llista ${getValues().name} creada`);
      router.push(`/projectes/${projectId}/llistes/${listId}`);
    } catch (e) {
      console.error(e);
      toast.error("No s'ha pogut crear la llista, torna-ho a provar més tard");
      return;
    } finally {
      reset();
      dialog.current?.close();
      setIsLoading(false);
    }
  }

  function openDialog() {
    dialog.current?.showModal();
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={openDialog}>
        <Plus />
        Crear llista
      </button>

      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Crear Llista</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control w-full">
              <div className="label label-text">Nom</div>
              <input
                {...register("name")}
                disabled={isLoading}
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
                disabled={isLoading}
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
                onClick={() => dialog.current?.close()}
                disabled={isLoading}
                className="btn btn-neutral"
              >
                Cancel·lar
              </button>
              <button disabled={isLoading} className="btn btn-primary">
                {isLoading && <span className="loading loading-spinner" />}
                Crear
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
