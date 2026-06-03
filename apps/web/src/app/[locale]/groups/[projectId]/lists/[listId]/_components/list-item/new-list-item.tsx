"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import CategoryPicker from "@/components/ui/category-picker";
import { InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { createListItemOffline } from "@/lib/offline/offline-actions";
import AddItemForm from "../../../_components/add-item/add-item-form";
import { useCategoryCreation } from "../../../_components/add-item/use-category-creation";
import { listItemSchema } from "./data";

export default function NewListItem({ list }: { list: List }) {
  const form = useForm({
    defaultValues: {
      name: "",
      completed: false,
      categoryId: "",
    },
    resolver: valibotResolver(listItemSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const { createAndSelect } = useCategoryCreation();
  const t = useTranslations("lists");

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (data.name === "") {
      return;
    }

    if (data.categoryId === "") {
      data.categoryId = null;
    }

    if (
      list.items.find(
        (i) => i.categoryId === data.categoryId && i.name === data.name,
      )
    ) {
      toast.error(t("itemAlreadyExists"));
      return;
    }

    try {
      const categoryName = project?.categories.find(
        (c) => c.id === data.categoryId,
      )?.name;
      await createListItemOffline(list, data, categoryName);
      form.reset({
        name: "",
        completed: false,
        categoryId: data.categoryId ?? "",
      });
      form.setFocus("name");
    } catch (e) {
      console.error("[new-list-item] createListItemOffline failed:", e);
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_list_item",
        projectId: list.projectId,
        listId: list.id,
      });
      toast.error(t("itemCreateError"));
      return;
    }
  }

  return (
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
          name="categoryId"
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
            {form.formState.isSubmitting ? <Spinner /> : <Check />}
          </Button>
        ) : null
      }
    />
  );
}
