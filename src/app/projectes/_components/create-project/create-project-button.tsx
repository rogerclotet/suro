"use client";

import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm from "@/components/ui/modal-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createProject } from "./actions";
import { createProjectSchema } from "./data";

export default function CreateProjectButton() {
  const { selectProject } = useProjects();
  const form = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(createProjectSchema),
  });
  const modalRef = React.useRef<HTMLDivElement>(null);

  async function onSubmit(data: v.InferInput<typeof createProjectSchema>) {
    try {
      const project = await createProject(data);
      if (!project) {
        throw new Error("Error creating project");
      }
      selectProject(project);
      toast.success(`Projecte ${form.getValues().name} creat`);
    } catch (e) {
      console.error(e);
      toast.error(
        "No s'ha pogut crear el projecte, torna-ho a provar més tard",
      );
      return;
    } finally {
      form.reset();
      modalRef.current?.click();
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => modalRef.current?.click()}
        className="gap-2"
      >
        <Plus />
        Crear projecte
      </Button>

      <ModalForm triggerRef={modalRef} title="Crear Projecte">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={form.formState.isSubmitting}
              className="w-full space-x-2"
            >
              {form.formState.isSubmitting && (
                <span className="loading loading-spinner" />
              )}
              Crear
            </Button>
          </form>
        </Form>
      </ModalForm>
    </>
  );
}
