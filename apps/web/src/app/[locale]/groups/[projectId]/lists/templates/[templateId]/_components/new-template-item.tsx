"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import CategoryPicker from "@/components/ui/category-picker";
import { InputGroupInput } from "@/components/ui/input-group";
import { useSession } from "@/lib/session";
import AddItemForm from "../../../_components/add-item/add-item-form";
import { useCategoryCreation } from "../../../_components/add-item/use-category-creation";
import { templateItemSchema } from "../../_components/create-template/data";
import { createTemplateItem } from "./actions";

type Item = Template["items"][number];

export default function NewTemplateItem({
  template,
  onCreate,
}: {
  template: Template;
  onCreate: (item: Item) => void;
}) {
  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const { createAndSelect } = useCategoryCreation();
  const t = useTranslations("lists");

  async function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    if (data.name === "") {
      return;
    }

    if (data.category === "") {
      data.category = null;
    }

    try {
      await createTemplateItem(template, data);
      onCreate({ name: data.name, category: data.category ?? null });
      form.reset({ name: "", category: data.category ?? "" });
      form.setFocus("name");
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_template_item",
        projectId: template.projectId,
        templateId: template.id,
      });
      toast.error(t("itemCreateError"));
      return;
    }
  }

  return (
    <li className="w-full">
      <AddItemForm
        onSubmit={form.handleSubmit(onSubmit)}
        nameInput={
          <Controller
            control={form.control}
            name="name"
            render={({ field }) => (
              <InputGroupInput
                placeholder={t("newItemPlaceholder")}
                disabled={form.formState.isSubmitting}
                {...field}
              />
            )}
          />
        }
        categoryControl={
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <CategoryPicker
                variant="ghost"
                categories={project?.categories ?? []}
                value={field.value || null}
                onChange={(categoryId) => field.onChange(categoryId ?? "")}
                onCreate={createAndSelect}
                disabled={form.formState.isSubmitting}
              />
            )}
          />
        }
        submitButton={
          form.formState.isDirty ? (
            <Button
              size="icon"
              variant="ghost"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check />
              )}
            </Button>
          ) : null
        }
      />
    </li>
  );
}
