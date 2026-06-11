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

  function onSubmit(data: v.InferInput<typeof listItemSchema>) {
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

    // Clear synchronously and let the mutation race in the background:
    // awaiting it would disable the input mid-flight, which blurs it and
    // closes the mobile keyboard between consecutive adds. The category stays
    // selected for fast same-section entry.
    form.reset({ name: "", completed: false, category: data.category });
    form.setFocus("name");

    createItem({
      listId: list.id as Id<"lists">,
      name: data.name,
      category: data.category,
    }).catch((e: unknown) => {
      console.error("[new-list-item] createListItemOffline failed:", e);
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_list_item",
        projectId: list.projectId,
        listId: list.id,
      });
      // Restore the lost name for a retry, unless a new one is mid-typing.
      if (form.getValues("name") === "") {
        form.setValue("name", data.name, { shouldDirty: true });
      }
      toast.error(t("itemCreateError"));
    });
  }

  return (
    <AddItemForm
      onSubmit={form.handleSubmit(onSubmit)}
      nameInput={
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <InputGroupInput placeholder={t("newItemPlaceholder")} {...field} />
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
  );
}
