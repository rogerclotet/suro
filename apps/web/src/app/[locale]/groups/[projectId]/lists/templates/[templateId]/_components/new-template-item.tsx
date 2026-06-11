"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check } from "lucide-react";
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
import { templateItemSchema } from "../../_components/create-template/data";

type Item = Template["items"][number];

export default function NewTemplateItem({
  template,
  onCreate,
}: {
  template: Template;
  onCreate: (item: Item) => Promise<void>;
}) {
  const form = useForm({
    defaultValues: {
      name: "",
      category: null,
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("lists");

  function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    if (data.name === "") {
      return;
    }

    // Clear synchronously and let the creation race in the background:
    // awaiting it would disable the input mid-flight, which blurs it and
    // closes the mobile keyboard between consecutive adds. The category stays
    // selected for fast same-section entry.
    form.reset({ name: "", category: data.category ?? null });
    form.setFocus("name");

    onCreate({ name: data.name, category: data.category ?? null }).catch(
      (e: unknown) => {
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "create_template_item",
          projectId: template.projectId,
          templateId: template.id,
        });
        // Restore the lost name for a retry, unless a new one is mid-typing.
        if (form.getValues("name") === "") {
          form.setValue("name", data.name, { shouldDirty: true });
        }
        toast.error(t("itemCreateError"));
      },
    );
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
                value={field.value ?? null}
                onChange={field.onChange}
              />
            )}
          />
        }
        submitButton={
          form.formState.isDirty ? (
            <Button
              size="icon"
              variant="ghost"
              // Keep focus (and the mobile keyboard) in the name input when
              // confirming with a tap instead of the keyboard's return key.
              onPointerDown={(e) => e.preventDefault()}
            >
              <Check />
            </Button>
          ) : null
        }
      />
    </li>
  );
}
