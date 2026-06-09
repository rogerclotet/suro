"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Edit, SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useSession } from "@/lib/session";
import { categorySchema } from "../../[listId]/_components/categories/data";

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
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const editCategory = useMutation(api.categories.update);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof categorySchema>) => {
      try {
        await editCategory({
          categoryId: category.id as Id<"categories">,
          name: data.name,
        });
        toast.success(t("editSuccess"));
        form.reset({ name: data.name });
      } catch (e) {
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "edit_category",
          projectId: category.projectId,
          categoryId: category.id,
        });
        toast.error(t("editError"));
      }
    },
    [category, form, session?.user.id, t, editCategory],
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
        <Button variant="ghost" size="icon" aria-label={t("editAriaLabel")}>
          <Edit />
        </Button>
      }
      title={t("editTitle")}
      description={t("editDescription")}
    >
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon("name")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <SubmitButton
            icon={<SaveIcon />}
            text={tCommon("save")}
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
