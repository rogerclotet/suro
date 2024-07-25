"use client";

import type { Project } from "@/app/_data/project";
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
import { captureException } from "@sentry/nextjs";
import { Edit } from "lucide-react";
import { useLogger } from "next-axiom";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { editProject } from "./actions";
import { projectSchema } from "./create-project/data";

export default function EditProjectButton({ project }: { project: Project }) {
  const form = useForm<v.InferInput<typeof projectSchema>>({
    defaultValues: {
      name: project.name,
    },
    resolver: valibotResolver(projectSchema),
  });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const log = useLogger();

  async function onSubmit(data: v.InferInput<typeof projectSchema>) {
    try {
      await editProject(project, data);
      toast.success(`Grup ${data.name} actualitzat`);
      triggerRef.current?.click();
    } catch (e) {
      captureException(e);
      log.error("Error editing project", { error: e, projectId: project.id });
      toast.error("No s'ha pogut editar el grup, torna-ho a provar més tard");
    }
  }

  return (
    <>
      <Button
        onClick={() => triggerRef.current?.click()}
        variant="ghost"
        size="icon"
        aria-label="Editar"
      >
        <Edit />
      </Button>

      <ModalForm
        triggerRef={triggerRef}
        title="Editar grup"
        description="Editar el nom del grup"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <span className="loading loading-spinner" />
              )}
              Desar
            </Button>
          </form>
        </Form>
      </ModalForm>
    </>
  );
}
