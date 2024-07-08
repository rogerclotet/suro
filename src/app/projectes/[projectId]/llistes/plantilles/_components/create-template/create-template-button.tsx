"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createTemplate } from "./actions";
import { templateSchema } from "./data";

export default function CreateTemplateButton({
  projectId,
}: {
  projectId: string;
}) {
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
      items: [],
    },
    resolver: valibotResolver(templateSchema),
  });
  const dialog = React.useRef<HTMLDialogElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  async function onSubmit(data: v.InferInput<typeof templateSchema>) {
    setIsLoading(true);
    try {
      const templateId = await createTemplate(projectId, data);
      toast.success(`Plantilla ${getValues().name} creada`);
      router.push(`/projectes/${projectId}/llistes/plantilles/${templateId}`);
    } catch (e) {
      console.error(e);
      toast.error(
        "No s'ha pogut crear la plantilla, torna-ho a provar més tard",
      );
      return;
    } finally {
      reset();
      dialog.current?.close();
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => dialog.current?.showModal()}
      >
        <Plus />
        Crear plantilla
      </button>

      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Crear plantilla</h3>

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
