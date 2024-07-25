"use client";

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
import { Plus } from "lucide-react";
import { useLogger } from "next-axiom";
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
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      items: [],
    },
    resolver: valibotResolver(templateSchema),
  });
  const router = useRouter();
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const log = useLogger();

  async function onSubmit(data: v.InferInput<typeof templateSchema>) {
    try {
      const templateId = await createTemplate(projectId, data);
      toast.success(`Plantilla ${form.getValues().name} creada`);
      router.push(`/grups/${projectId}/llistes/plantilles/${templateId}`);
    } catch (e) {
      captureException(e);
      log.error("Error creating template", { error: e, projectId });
      toast.error(
        "No s'ha pogut crear la plantilla, torna-ho a provar més tard",
      );
      return;
    } finally {
      form.reset();
    }
  }

  return (
    <>
      <Button
        onClick={() => triggerRef.current?.click()}
        variant="secondary"
        size="sm"
        className="gap-2"
      >
        <Plus />
        Crear plantilla
      </Button>

      <ModalForm
        triggerRef={triggerRef}
        title="Crear plantilla"
        description="Crear una plantilla nova"
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
