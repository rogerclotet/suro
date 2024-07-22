"use client";

import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { captureException } from "@sentry/nextjs";
import { Check, Loader2, Tag } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import NewCategoryModal from "./categories/new-category-modal";
import { listItemSchema } from "./data";

export default function ListItem(props: {
  list: List;
  id: string;
  name: string;
  categoryId: string | null;
  completed: boolean;
  onChange: (
    name: string,
    completed: boolean,
    categoryId: string | null,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const form = useForm({
    defaultValues: {
      name: props.name,
      completed: props.completed ?? false,
      categoryId: props.categoryId,
    },
    resolver: valibotResolver(listItemSchema),
  });
  const newCategoryModalRef = React.useRef<HTMLDivElement>(null);
  const { project } = useProjects();
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    try {
      const parsed = v.parse(listItemSchema, data);

      if (parsed.name === "") {
        await props.onDelete?.();
        return;
      }

      await props.onChange(
        parsed.name,
        parsed.completed,
        parsed.categoryId === "" ? null : parsed.categoryId ?? null,
      );

      form.reset({
        name: parsed.name,
        completed: parsed.completed,
        categoryId: parsed.categoryId,
      });
    } catch (e) {
      captureException(e);
      console.error(e);
      toast.error(
        "No s'ha pogut actualitzar l'element, torna-ho a provar més tard",
      );
      return;
    }
  }

  async function handleNameBlur(_e: React.FocusEvent<HTMLInputElement>) {
    if (form.formState.isDirty) {
      formRef.current?.requestSubmit();
    }
  }

  async function handleCategoryChange(
    value: string,
    onChange: (value: string) => void,
  ) {
    if (value === "new") {
      newCategoryModalRef.current?.click();
      return;
    }

    if (value === "-") {
      onChange("");
    } else {
      onChange(value);
    }

    formRef.current?.requestSubmit();
  }

  return (
    <li>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-row items-center gap-2"
          ref={formRef}
        >
          <FormField
            control={form.control}
            name="completed"
            render={({ field }) => (
              <FormItem className="h-5 w-5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      formRef.current?.requestSubmit();
                    }}
                    disabled={form.formState.isSubmitting}
                    className="h-5 w-5 transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input
                    {...field}
                    onBlur={(e) => handleNameBlur(e)}
                    className={cn(
                      "border-none",
                      form.getValues().completed && "line-through",
                    )}
                    disabled={
                      form.formState.isSubmitting || form.getValues().completed
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.isDirty && (
            <Button
              size="icon"
              variant="ghost"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check />
              )}
            </Button>
          )}

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <FormItem>
                <FormControl>
                  <Select
                    defaultValue={value ?? ""}
                    onValueChange={(v) => handleCategoryChange(v, onChange)}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Tag />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="-">Sense categoria</SelectItem>
                      {project?.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Nova categoria</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <NewCategoryModal
        triggerRef={newCategoryModalRef}
        onCreate={(categoryId) => form.setValue("categoryId", categoryId)}
      />
    </li>
  );
}
