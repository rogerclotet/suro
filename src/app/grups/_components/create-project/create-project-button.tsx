"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
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
import { createProject } from "./actions";
import { projectSchema } from "./data";

export default function CreateProjectButton() {
  const { selectProject } = useProjects();
  const form = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(projectSchema),
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof projectSchema>) {
    try {
      const project = await createProject(data);
      if (!project) {
        throw new Error("Error creating project");
      }
      selectProject(project);
      toast.success(`Grup ${form.getValues().name} creat`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_project",
      });
      toast.error("No s'ha pogut crear el grup, torna-ho a provar més tard");
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
        Crear grup
      </Button>

      <ModalForm
        triggerRef={modalRef}
        title="Crear grup"
        description="Els grups permeten convidar altres usuaris i compartir llistes, calendari i fitxers amb ells"
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
