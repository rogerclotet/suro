"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { captureException } from "@sentry/nextjs";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLogger } from "next-axiom";
import React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "./actions";
import { noteSchema } from "./schema";

export default function CreateNoteButton({ projectId }: { projectId: string }) {
  const form = useForm({
    defaultValues: {
      name: "",
      contents: "",
    },
    resolver: valibotResolver(noteSchema),
  });
  const router = useRouter();
  const { project } = useProjects();
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const log = useLogger();

  async function onSubmit(data: v.InferInput<typeof noteSchema>) {
    if (!project) {
      toast.error("No s'ha seleccionat cap projecte");
      return;
    }

    try {
      const noteId = await createNote(project, data);
      toast.success(`Nota ${form.getValues().name} creada`);
      router.push(`/grups/${projectId}/notes/${noteId}`);
    } catch (e) {
      captureException(e);
      log.error("Error creating note", { error: e, projectId });
      toast.error("No s'ha pogut crear la nota, torna-ho a provar més tard");
    } finally {
      form.reset();
    }
  }

  return (
    <>
      <Button
        onClick={() => triggerRef.current?.click()}
        variant="default"
        size="sm"
        className="gap-2"
      >
        <Plus />
        Crear nota
      </Button>

      <ModalForm
        triggerRef={triggerRef}
        title="Crear nota"
        description="Crear una nota nova"
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

            <FormField
              control={form.control}
              name="contents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
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
