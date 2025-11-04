"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Loader2, SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import type { List, ListItem } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  triggerRef: React.RefObject<HTMLDivElement | null>;
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
    form.setFocus("name");
  }, [form]);

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (!form.formState.isDirty) {
      return;
    }

    try {
      const parsed = v.parse(listItemSchema, data);

      if (parsed.name === "") {
        await props.onDelete?.();
        return;
      }

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

      props.triggerRef.current?.click();
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
    <ModalForm title={props.item.name} triggerRef={props.triggerRef}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => {
              const id = `${props.list.id}-${props.item.id}-${field.name}`;
              return (
                <FormItem className="grow">
                  <FormLabel htmlFor={id}>Editar</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id={id}
                      className={cn("border-none")}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="details"
            render={({ field }) => {
              const id = `${props.list.id}-${props.item.id}-${field.name}`;
              return (
                <FormItem>
                  <FormLabel htmlFor={id}>Detalls</FormLabel>
                  <FormControl>
                    <Textarea {...field} id={id} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => {
              const id = `${props.list.id}-${props.item.id}-${field.name}`;
              return (
                <FormItem>
                  <FormLabel htmlFor={id}>Categoria</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      value={field.value ?? undefined}
                      onValueChange={(value) => {
                        field.onChange(value === "-" ? null : value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger id={id}>
                          <SelectValue placeholder="Sense categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="-">Sense categoria</SelectItem>
                        {project.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <Button
            type="submit"
            disabled={!form.formState.isDirty || form.formState.isSubmitting}
            className="w-full space-x-2"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            Desar
          </Button>
        </form>
      </Form>
    </ModalForm>
  );
}
