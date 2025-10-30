"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Category } from "@/app/_data/category";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm from "@/components/ui/modal-form";
import { categorySchema } from "../../[listId]/_components/categories/data";
import { editCategory } from "./actions";

export default function EditCategoryButton({
  category,
}: {
  category: Category;
}) {
  const form = useForm<v.InferInput<typeof categorySchema>>({
    defaultValues: {
      name: category.name,
    },
    resolver: valibotResolver(categorySchema),
  });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof categorySchema>) {
    try {
      await editCategory(category, data);
      toast.success("Categoria editada correctament");
      triggerRef.current?.click();
      form.reset({ name: data.name });
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "edit_category",
        projectId: category.projectId,
        categoryId: category.id,
      });
      toast.error(
        "No s'ha pogut editar la categoria. Torna-ho a provar més tard",
      );
    }
  }

  return (
    <>
      <Button
        onClick={() => triggerRef.current?.click()}
        variant="ghost"
        size="icon"
        aria-label="Editar categoria"
      >
        <Edit />
      </Button>

      <ModalForm
        triggerRef={triggerRef}
        title="Editar categoria"
        description="Editar el nom de la categoria"
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
                </FormItem>
              )}
            />

            <Button
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
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
