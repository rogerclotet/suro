"use client";

import { useProjectsStore } from "@/app/_state/projects";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createProject } from "./actions";
import { createProjectSchema } from "./data";

export default function CreateProject() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(createProjectSchema),
  });
  const dialog = React.useRef<HTMLDialogElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const addProject = useProjectsStore((state) => state.addProject);
  const selectProject = useProjectsStore((state) => state.selectProject);

  async function onSubmit(data: v.InferInput<typeof createProjectSchema>) {
    setIsLoading(true);
    try {
      const project = await createProject(data);

      toast.success(`Projecte ${project.name} creat`);

      addProject(project);
      selectProject(project.id);
    } catch (e) {
      console.error(e);
      toast.error(
        "No s'ha pogut crear el projecte, torna-ho a provar més tard",
      );
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
        Crear projecte
      </button>

      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Crear Projecte</h3>

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
