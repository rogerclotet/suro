"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FocusEvent, type KeyboardEvent, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type * as v from "valibot";
import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import CategoryPicker from "@/components/ui/category-picker";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import AddItemForm from "../../../_components/add-item/add-item-form";
import { listItemSchema } from "./data";
import useCreateListItem from "./use-create-list-item";

type InlineAddItemProps = {
  list: List;
  /** Fixed target category for this row; null = the bottom no-category row. */
  category: string | null;
  active: boolean;
  /** Bottom row only: lets the user redirect the new item to any category. */
  withCategoryPicker?: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  /** Reports the category actually used so focus can follow the item. */
  onSubmitted: (category: string | null) => void;
};

/**
 * Per-section inline "add item" row: a muted ghost button that expands into a
 * name input on tap. Items created here go to this row's category; only the
 * bottom no-category row carries a quick category selector.
 */
export default function InlineAddItem(props: InlineAddItemProps) {
  const t = useTranslations("lists");

  if (!props.active) {
    return (
      <button
        type="button"
        onClick={props.onActivate}
        className="flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted"
      >
        <Plus className="size-4" />
        {t("addItem")}
      </button>
    );
  }

  return <ActiveAddItemRow {...props} />;
}

/** The expanded form; separate so its hooks mount fresh per activation. */
function ActiveAddItemRow(props: InlineAddItemProps) {
  const t = useTranslations("lists");
  const { project } = useProjects();
  // While the picker's popover/drawer (a portal) holds focus, blur events
  // leave the row's subtree without the user actually abandoning the row.
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      completed: false,
      category: props.category,
    },
    resolver: valibotResolver(listItemSchema),
  });

  const { submit } = useCreateListItem(props.list, (lostName) => {
    // Restore the lost name for a retry, unless a new one is mid-typing.
    if (form.getValues("name") === "") {
      form.setValue("name", lostName, { shouldDirty: true });
    }
  });

  function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (data.name === "") {
      return;
    }
    const category = props.withCategoryPicker ? data.category : props.category;
    if (!submit(data.name, category)) {
      return; // duplicate: keep the text for editing
    }
    // Clear synchronously (see useCreateListItem for why the mutation is not
    // awaited) and hand focus to the used category's row.
    form.reset({ name: "", completed: false, category: props.category });
    if (category === props.category) {
      form.setFocus("name");
    }
    props.onSubmitted(category);
  }

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (pickerOpen || e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    if (form.getValues("name") === "") {
      props.onDeactivate();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      props.onDeactivate();
    }
  }

  const nameInput = (
    <Controller
      control={form.control}
      name="name"
      render={({ field }) => (
        <InputGroupInput
          placeholder={t("newItemPlaceholder")}
          autoFocus
          {...field}
        />
      )}
    />
  );

  const submitButton = form.formState.isDirty ? (
    <Button
      size="icon"
      variant="ghost"
      // Keep focus (and the mobile keyboard) in the name input when
      // confirming with a tap instead of the keyboard's return key.
      onPointerDown={(e) => e.preventDefault()}
    >
      <Check />
    </Button>
  ) : null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: blur/escape handling for the row's inputs, not an interactive element itself.
    <div onBlur={handleBlur} onKeyDown={handleKeyDown}>
      {props.withCategoryPicker ? (
        <AddItemForm
          onSubmit={form.handleSubmit(onSubmit)}
          nameInput={nameInput}
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
                  onOpenChange={setPickerOpen}
                />
              )}
            />
          }
          submitButton={submitButton}
        />
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <InputGroup>
            {nameInput}
            <InputGroupAddon align="inline-end">{submitButton}</InputGroupAddon>
          </InputGroup>
        </form>
      )}
    </div>
  );
}
