"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FocusEvent, KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import type * as v from "valibot";
import type { List } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DEFAULT_TASK_FORM_VALUES,
  listItemSchema,
  taskArgsFromForm,
} from "./data";
import useCreateListItem from "./use-create-list-item";

type InlineAddItemProps = {
  list: List;
  /** This row's fixed target category. */
  category: string;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  /** Reports the add so focus can follow the item. */
  onSubmitted: (category: string) => void;
};

/**
 * Per-section inline "add item" row: a muted ghost button that expands into a
 * name input on tap. Items created here go to this row's category; the
 * no-category entry point is the always-visible form at the top of the list.
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

  const form = useForm({
    defaultValues: {
      name: "",
      completed: false,
      category: props.category,
      ...DEFAULT_TASK_FORM_VALUES,
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
    // Quick-add rows stay name-only; on task lists the item is created with no
    // task fields (set them later via the edit form).
    const task = taskArgsFromForm(data);
    if (!submit(data.name, props.category, task)) {
      return; // duplicate: keep the text for editing
    }
    // Clear synchronously (see useCreateListItem for why the mutation is not
    // awaited) and keep focus here for the next entry.
    form.reset({
      name: "",
      completed: false,
      category: props.category,
      ...DEFAULT_TASK_FORM_VALUES,
    });
    form.setFocus("name");
    props.onSubmitted(props.category);
  }

  function handleBlur(e: FocusEvent<HTMLFormElement>) {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    if (form.getValues("name") === "") {
      props.onDeactivate();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      props.onDeactivate();
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-full"
    >
      <InputGroup>
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
        <InputGroupAddon align="inline-end">
          {/* Always visible so the affordance isn't enter-key-only; disabled
              until there's something to add. */}
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
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
