"use client";

import { useProjectsStore } from "@/app/_state/projects";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createProject } from "./actions";
import { createProjectSchema } from "./data";

export default function CreateProject({ onClose }: { onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(createProjectSchema),
  });
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
        "No s'ha pogut crear el projecte. Torna-ho a provar més tard",
      );
      return;
    } finally {
      setIsLoading(false);
      onClose();
    }
  }

  return (
    <div className="card bg-base-100 shadow-lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card-body">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-square btn-ghost btn-sm absolute right-2 top-2"
          >
            <X />
          </button>
          <h2 className="card-title">Crear Projecte</h2>
          <label className="form-control w-full max-w-xs">
            <input
              {...register("name")}
              disabled={isLoading}
              placeholder="Nom"
              className="input input-bordered w-full max-w-xs"
            />
            {errors.name && (
              <div className="label w-full">
                <span className="label-text-alt text-error">
                  {errors.name.message?.toString()}
                </span>
              </div>
            )}
          </label>
          <div className="card-actions justify-end">
            <button disabled={isLoading} className="btn btn-primary">
              {isLoading && <span className="loading loading-spinner" />}
              Crear
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
