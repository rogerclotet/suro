"use client";

import type { Template } from "@/app/_data/list";
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
import { valibotResolver } from "@hookform/resolvers/valibot";
import { captureException } from "@sentry/nextjs";
import { Loader2 } from "lucide-react";
import { useLogger } from "next-axiom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { templateSchema } from "../create-template/data";
import { updateTemplate } from "./actions";

export default function EditTemplateForm({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const form = useForm({
    defaultValues: {
      name: template.name,
      description: template.description ?? "",
      items: template.items,
    },
    resolver: valibotResolver(templateSchema),
  });
  const { project } = useProjects();
  const log = useLogger();

  async function onSubmit(data: v.InferInput<typeof templateSchema>) {
    try {
      await updateTemplate(template, data);
      toast.success(`Plantilla ${data.name} actualitzada`);
    } catch (e) {
      captureException(e);
      log.error("Error editing template", {
        error: e,
        projectId: project?.id,
        templateId: template.id,
      });
      toast.error(
        "No s'ha pogut actualitzar la plantilla, torna-ho a provar més tard",
      );
    } finally {
      onClose();
    }
  }

  return (
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
          {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
          Desar
        </Button>
      </form>
    </Form>
  );
}
