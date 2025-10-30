"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, type RefObject, useCallback, useRef } from "react";
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
import { createCategory } from "./actions";
import { categorySchema } from "./data";

export default function NewCategoryModal({
  triggerRef,
  onCreate,
}: {
  triggerRef: RefObject<HTMLDivElement | null>;
  onCreate?: (categoryId: string) => void;
}) {
  const { project, addCategory } = useProjects();
  const form = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(categorySchema),
  });
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof categorySchema>) {
    try {
      if (!project) {
        throw new Error("No project selected");
      }

      const categoryId = await createCategory(project, data);
      addCategory({
        id: categoryId,
        name: data.name,
        projectId: project.id,
      });

      // Add to queue to allow components to update categories
      setTimeout(() => onCreate?.(categoryId), 0);

      triggerRef.current?.click();
      form.reset();

      toast.success(`Categoria ${data.name} creada`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_category",
        projectId: project?.id,
      });
      toast.error(
        "No s'ha pogut crear la categoria, torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalForm
      triggerRef={triggerRef}
      title="Nova categoria"
      description="Crea i selecciona una cagegoria nova"
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
              <Loader2 className="animate-spin" />
            )}
            Crear
          </Button>
        </form>
      </Form>
    </ModalForm>
  );
}
