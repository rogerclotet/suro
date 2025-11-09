"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect } from "react";
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
import ModalForm from "@/components/ui/modal-form";
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
  const form = useForm({
    defaultValues: {
      name: props.item.name,
      details: props.item.details ?? "",
      completed: props.item.completed ?? false,
      categoryId: props.item.categoryId,
    },
    resolver: valibotResolver(listItemSchema),
  });
  const { data: session } = useSession();
  const { project } = useProjects();

  useEffect(() => {
    // Update the form values when the item changes
    form.reset({
      name: props.item.name,
      details: props.item.details ?? "",
      completed: props.item.completed ?? false,
      categoryId: props.item.categoryId ?? "",
    });
  }, [form, props.item]);

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (!form.formState.isDirty) {
      return;
    }

    try {
      const parsed = v.parse(listItemSchema, data);

      if (
        form.formState.dirtyFields.name &&
        props.list.items.filter(
          (i) => i.categoryId === data.categoryId && i.name === data.name,
        ).length > 0
      ) {
        toast.error("Ja existeix un element amb aquest nom");
        return;
      }

      await props.onChange(
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
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "update_list_item",
        projectId: props.list.projectId,
        listId: props.list.id,
        itemId: props.item.id,
      });
      toast.error(
        "No s'ha pogut actualitzar l'element, torna-ho a provar més tard",
      );
      return;
    }
  }

  if (!project) {
    return null;
  }

  return (
    <ModalForm title={props.item.name} trigger={props.trigger}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => {
            const id = `${props.list.id}-${props.item.id}-${field.name}`;
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={id}>Editar</FieldLabel>
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
            const id = `${props.list.id}-${props.item.id}-${field.name}`;
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={id}>Detalls</FieldLabel>
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
            const id = `${props.list.id}-${props.item.id}-${field.name}`;
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={id}>Categoria</FieldLabel>
                <FieldContent>
                  <Select
                    {...field}
                    value={field.value ?? undefined}
                    onValueChange={(value) => {
                      field.onChange(value === "-" ? null : value);
                    }}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue placeholder="Sense categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Sense categoria</SelectItem>
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
          text="Desar"
          icon={<SaveIcon />}
          formState={form.formState}
        />
      </form>
    </ModalForm>
  );
}
