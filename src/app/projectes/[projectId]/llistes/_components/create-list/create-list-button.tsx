"use client";

import type { Template } from "@/app/_data/list";
import { useSelectedProject } from "@/app/_state/project-state";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createList } from "./actions";
import { listSchema } from "./data";

export default function CreateListButton({
  projectId,
  templates,
}: {
  projectId: string;
  templates: Template[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      templates: [] as string[],
    },
    resolver: valibotResolver(listSchema),
  });
  const dialog = React.useRef<HTMLDialogElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const [selectedTemplates, setSelectedTemplates] = React.useState<string[]>(
    [],
  );
  const { project } = useSelectedProject();

  if (!project) {
    return null;
  }

  async function onSubmit(data: v.InferInput<typeof listSchema>) {
    setIsLoading(true);
    try {
      const listId = await createList(project!, data);
      toast.success(`Llista ${getValues().name} creada`);
      router.push(`/projectes/${projectId}/llistes/${listId}`);
    } catch (e) {
      console.error(e);
      toast.error("No s'ha pogut crear la llista, torna-ho a provar més tard");
      return;
    } finally {
      reset();
      setSelectedTemplates([]);
      dialog.current?.close();
      setIsLoading(false);
    }
  }

  function handleTemplateToggle(templateId: string) {
    let newTemplates = [...selectedTemplates];

    if (selectedTemplates.includes(templateId)) {
      newTemplates = newTemplates.filter((t) => t !== templateId);
    } else {
      newTemplates.push(templateId);
    }

    setSelectedTemplates(newTemplates);
    setValue("templates", newTemplates);
  }

  return (
    <>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => dialog.current?.showModal()}
      >
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
            <div className="form-control w-full">
              <div className="label label-text">Incloure plantilles</div>
              <div className="flex flex-col gap-2">
                {templates.map((template) => (
                  <label
                    key={template.id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => handleTemplateToggle(template.id)}
                      disabled={isLoading}
                      className="checkbox"
                    />
                    <span className="label-text">
                      {template.name} ({template.items.length} elements)
                    </span>
                  </label>
                ))}
              </div>
              {errors.templates && (
                <div className="label w-full">
                  <span className="label-text-alt text-error">
                    {errors.templates.message?.toString()}
                  </span>
                </div>
              )}
            </div>
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
