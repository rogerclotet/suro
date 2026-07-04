"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import type * as v from "valibot";
import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import CategoryPicker from "@/components/ui/category-picker";
import { InputGroupInput } from "@/components/ui/input-group";
import AddItemForm from "../../../_components/add-item/add-item-form";
import {
  DEFAULT_TASK_FORM_VALUES,
  listItemSchema,
  taskArgsFromForm,
} from "./data";
import { NewItemTaskControls } from "./new-item-task-controls";
import useCreateListItem from "./use-create-list-item";

/**
 * The list's always-visible add form at the top: a name input plus the quick
 * category selector (defaults to no category, whose section sits right below).
 * Categorized adds hand focus to that category's inline row via `onSubmitted`.
 */
export default function NewListItem({
  list,
  onSubmitted,
}: {
  list: List;
  /** Reports the category actually used so focus can follow the item. */
  onSubmitted: (category: string | null) => void;
}) {
  const form = useForm({
    defaultValues: {
      name: "",
      completed: false,
      category: null,
      ...DEFAULT_TASK_FORM_VALUES,
    },
    resolver: valibotResolver(listItemSchema),
  });
  const { project } = useProjects();
  const t = useTranslations("lists");

  const { submit } = useCreateListItem(list, (lostName) => {
    // Restore the lost name for a retry, unless a new one is mid-typing.
    if (form.getValues("name") === "") {
      form.setValue("name", lostName, { shouldDirty: true });
    }
  });

  function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (data.name === "") {
      return;
    }
    // On task lists the inline due/assignee/priority/repeat ride along; on a
    // plain checklist these stay at defaults and resolve to no task fields.
    const task = taskArgsFromForm(data);
    if (!submit(data.name, data.category, task)) {
      return; // duplicate: keep the text for editing
    }
    // Clear synchronously (see useCreateListItem for why the mutation is not
    // awaited). No-category adds land right below, so focus stays here;
    // categorized adds hand it to that category's row.
    form.reset({
      name: "",
      completed: false,
      category: null,
      ...DEFAULT_TASK_FORM_VALUES,
    });
    if (data.category === null) {
      form.setFocus("name");
    }
    onSubmitted(data.category);
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
              // On task lists the row is tight, so show just the tag icon; keep
              // the "No category" label only on plain checklists.
              iconOnly
              categories={project?.categories ?? []}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      }
      // Task lists surface the due/assignee/priority/repeat controls inline,
      // right beside the category picker; a plain checklist never mounts them.
      extraControls={
        project ? (
          <NewItemTaskControls control={form.control} members={project.users} />
        ) : undefined
      }
      submitButton={
        // Always visible so the affordance isn't enter-key-only; disabled
        // until there's something to add.
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          aria-label={t("addItem")}
          disabled={!form.formState.isDirty}
          // Keep focus (and the mobile keyboard) in the name input when
          // confirming with a tap instead of the keyboard's return key.
          onPointerDown={(e) => e.preventDefault()}
        >
          <Check />
        </Button>
      }
    />
  );
}
