"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Edit, SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
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
import SubmitButton from "@/components/ui/submit-button";
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
  const { data: session } = useSession();

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof categorySchema>) => {
      try {
        await editCategory(category, data);
        toast.success("Categoria editada correctament");
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
    },
    [category, form, session?.user.id],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <ModalForm
      trigger={
        <Button variant="ghost" size="icon" aria-label="Editar categoria">
          <Edit />
        </Button>
      }
      title="Editar categoria"
      description="Editar el nom de la categoria"
    >
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
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

          <SubmitButton
            icon={<SaveIcon />}
            text="Desar"
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
