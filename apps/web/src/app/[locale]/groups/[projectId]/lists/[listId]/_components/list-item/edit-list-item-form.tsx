"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import type { List, ListItem } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { listItemSchema } from "./data";

export default function EditListItemForm(props: {
  list: List;
  item: ListItem;
  onChange: (
    name: string,
    details: string,
    completed: boolean,
    categoryId: string | null,
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
    categoryId: string | null,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { item, list, onChange } = props;
  const { id: itemId } = item;
  const { id: listId, items: listItems, projectId } = list;

  const form = useForm({
    defaultValues: {
      name: item.name,
      details: item.details ?? "",
      completed: item.completed ?? false,
      categoryId: item.categoryId,
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
            (i) => i.categoryId === data.categoryId && i.name === data.name,
          ).length > 0
        ) {
          toast.error(t("itemAlreadyExists"));
          return;
        }

        await onChange(
          parsed.name,
          parsed.details ?? "",
          parsed.completed,
          parsed.categoryId === "" ? null : (parsed.categoryId ?? null),
        );

        form.reset({
          name: parsed.name,
          details: parsed.details ?? "",
          completed: parsed.completed,
          categoryId: parsed.categoryId,
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

  if (!project) {
    return null;
  }

  return (
    <form onSubmit={handleFormSubmit}>
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
        name="categoryId"
        render={({ field, fieldState }) => {
          const id = `${listId}-${itemId}-${field.name}`;
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={id}>{t("categoryLabel")}</FieldLabel>
              <FieldContent>
                <Select
                  {...field}
                  value={field.value ?? undefined}
                  onValueChange={(value) => {
                    field.onChange(value === "-" ? null : value);
                  }}
                >
                  <SelectTrigger id={id}>
                    <SelectValue placeholder={tCommon("noCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">{tCommon("noCategory")}</SelectItem>
                    {project.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldError errors={[fieldState.error]} />
            </Field>
          );
        }}
      />

      <SubmitButton
        text={tCommon("save")}
        icon={<SaveIcon />}
        formState={form.formState}
        disabled={!form.formState.isDirty}
      />
    </form>
  );
}
