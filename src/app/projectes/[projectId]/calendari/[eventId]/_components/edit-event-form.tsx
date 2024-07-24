"use client";

import type { Event } from "@/app/_data/event";
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
import { captureException } from "@sentry/nextjs";
import { Loader2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { editEventSchema } from "../../_components/event/data";
import { editEvent } from "../actions";

export default function EditEventForm({
  event,
  triggerRef,
}: {
  event: Event;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
  const { project } = useProjects();
  const form = useForm<v.InferInput<typeof editEventSchema>>({
    defaultValues: {
      name: event.name,
      description: event.description ?? "",
    },
    resolver: valibotResolver(editEventSchema),
  });

  async function onSubmit(data: v.InferInput<typeof editEventSchema>) {
    try {
      await editEvent(event, data, project!);
      toast.success("Editat correctament");
      form.reset({ name: event.name, description: event.description ?? "" });
      triggerRef.current?.click();
    } catch (e) {
      captureException(e);
      console.error(e);
      toast.error("Error editant l'esdeveniment. Torna-ho a provar més tard");
    }
  }

  return (
    <ModalForm
      triggerRef={triggerRef}
      title="Editar esdeveniment"
      description="Editar el nom i descripció de l'esdeveniment"
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripció</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={form.formState.isSubmitting}
            className="w-full gap-2"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="animate-spin" />
            )}
            Desar
          </Button>
        </form>
      </Form>
    </ModalForm>
  );
}
