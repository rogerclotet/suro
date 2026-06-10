"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Check } from "lucide-react";
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
import { useSession } from "@/lib/session";
import AddItemForm from "../../../_components/add-item/add-item-form";
import { listItemSchema } from "./data";

export default function NewListItem({ list }: { list: List }) {
  const form = useForm({
    defaultValues: {
      name: "",
      completed: false,
      category: null,
    },
    resolver: valibotResolver(listItemSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const createItem = useMutation(api.listItems.create);
  const t = useTranslations("lists");

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (data.name === "") {
      return;
    }

    if (
      list.items.find(
        (i) => i.category === data.category && i.name === data.name,
      )
    ) {
      toast.error(t("itemAlreadyExists"));
      return;
    }

    try {
      await createItem({
        listId: list.id as Id<"lists">,
        name: data.name,
        category: data.category,
      });
      // Keep the category selected for fast same-section entry.
      form.reset({ name: "", completed: false, category: data.category });
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
          name="category"
          render={({ field }) => (
            <CategoryPicker
              variant="ghost"
              categories={project?.categories ?? []}
              value={field.value}
              onChange={field.onChange}
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
