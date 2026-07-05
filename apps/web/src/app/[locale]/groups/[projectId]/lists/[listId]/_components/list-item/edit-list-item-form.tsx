"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { SaveIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import type { List, ListItem } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import CategoryPicker from "@/components/ui/category-picker";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import ModalAction from "@/components/ui/modal-action";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  listItemSchema,
  presetFromRecurrence,
  type TaskMutationArgs,
  taskArgsFromForm,
} from "./data";
import { TaskFields } from "./task-fields";

export default function EditListItemForm(props: {
  list: List;
  item: ListItem;
  onChange: (
    name: string,
    details: string,
    completed: boolean,
    category: string | null,
    task: TaskMutationArgs,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
  trigger: React.ReactNode;
}) {
  return (
    <ModalForm title={props.item.name} trigger={props.trigger}>
      <EditListItemFormContent {...props} />
    </ModalForm>
  );
}

function EditListItemFormContent(props: {
  list: List;
  item: ListItem;
  onChange: (
    name: string,
    details: string,
    completed: boolean,
    category: string | null,
    task: TaskMutationArgs,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { item, list, onChange, onDelete } = props;
  const { id: itemId } = item;
  const { id: listId, items: listItems, projectId } = list;

  const form = useForm({
    defaultValues: {
      name: item.name,
      details: item.details ?? "",
      completed: item.completed ?? false,
      category: item.category,
      dueAt: item.dueAt,
      dueAllDay: item.dueAllDay,
      assigneeId: item.assigneeId,
      priority: item.priority,
      recurrence: presetFromRecurrence(item.recurrence),
    },
    resolver: valibotResolver(listItemSchema),
  });
  const { data: session } = useSession();
  const { project } = useProjects();
  const { close } = useModalForm();
  const t = useTranslations("lists");
  const tCommon = useTranslations("common");

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof listItemSchema>) => {
      if (!form.formState.isDirty) {
        return;
      }

      try {
        const parsed = v.parse(listItemSchema, data);

        if (
          form.formState.dirtyFields.name &&
          listItems.filter(
            (i) => i.category === data.category && i.name === data.name,
          ).length > 0
        ) {
          toast.error(t("itemAlreadyExists"));
          return;
        }

        // Task lists send the edited task fields; plain checklists forward the
        // item's existing ones (all undefined) so nothing is cleared.
        const task = taskArgsFromForm(parsed);

        await onChange(
          parsed.name,
          parsed.details ?? "",
          parsed.completed,
          parsed.category,
          task,
        );

        form.reset({
          name: parsed.name,
          details: parsed.details ?? "",
          completed: parsed.completed,
          category: parsed.category,
          dueAt: parsed.dueAt,
          dueAllDay: parsed.dueAllDay,
          assigneeId: parsed.assigneeId,
          priority: parsed.priority,
          recurrence: parsed.recurrence,
        });
        toast.success(t("itemUpdated"));
        close();
      } catch (e) {
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "update_list_item",
          projectId,
          listId,
          itemId,
        });
        toast.error(t("itemUpdateError"));
      }
    },
    [
      close,
      form,
      itemId,
      listId,
      listItems,
      onChange,
      projectId,
      session?.user.id,
      t,
    ],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  const handleDelete = useCallback(async () => {
    if (!onDelete) {
      return;
    }

    try {
      await onDelete();
      toast.success(t("deleteItemSuccess"));
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_list_item",
        projectId,
        listId,
        itemId,
      });
      toast.error(t("deleteItemError"));
    }
  }, [close, itemId, listId, onDelete, projectId, session?.user.id, t]);

  if (!project) {
    return null;
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => {
          const id = `${listId}-${itemId}-${field.name}`;
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={id}>{t("editItemLabel")}</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id={id}
                  className={cn("border-none")}
                  disabled={form.formState.isSubmitting}
                />
              </FieldContent>
              <FieldError errors={[fieldState.error]} />
            </Field>
          );
        }}
      />

      <Controller
        control={form.control}
        name="details"
        render={({ field, fieldState }) => {
          const id = `${listId}-${itemId}-${field.name}`;
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={id}>{t("detailsLabel")}</FieldLabel>
              <FieldContent>
                <Textarea {...field} id={id} />
              </FieldContent>
              <FieldError errors={[fieldState.error]} />
            </Field>
          );
        }}
      />

      <Controller
        control={form.control}
        name="category"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("categoryLabel")}</FieldLabel>
            <FieldContent>
              <CategoryPicker
                categories={project.categories}
                value={field.value}
                onChange={field.onChange}
                disabled={form.formState.isSubmitting}
              />
            </FieldContent>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <TaskFields
        control={form.control}
        members={project.users}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex flex-col gap-3">
        <SubmitButton
          text={tCommon("save")}
          icon={<SaveIcon />}
          formState={form.formState}
          disabled={!form.formState.isDirty}
        />

        {onDelete ? (
          <ModalAction
            title={t("deleteItemTitle")}
            description={t("deleteItemDescription")}
            actionText={tCommon("delete")}
            onAction={handleDelete}
            variant="destructive"
            trigger={
              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
              >
                <Trash2 />
                {tCommon("delete")}
              </Button>
            }
          />
        ) : null}
      </div>
    </form>
  );
}
