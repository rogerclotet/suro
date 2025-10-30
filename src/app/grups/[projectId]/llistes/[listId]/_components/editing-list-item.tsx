"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import type { List } from "@/app/_data/list";
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
import { cn } from "@/lib/utils";
import { listItemSchema } from "./data";

export default function EditingListItem(props: {
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
  onBlur?: () => void;
}) {
  const form = useForm({
    defaultValues: {
      name: props.name,
      completed: props.completed ?? false,
      categoryId: props.categoryId,
    },
    resolver: valibotResolver(listItemSchema),
  });
  const formRef = useRef<HTMLFormElement>(null);
  const { data: session } = useSession();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    form.setFocus("name");
  }, []);

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (!form.formState.isDirty) {
      props.onBlur?.();
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
        parsed.completed,
        parsed.categoryId === "" ? null : (parsed.categoryId ?? null),
      );

      form.reset({
        name: parsed.name,
        completed: parsed.completed,
        categoryId: parsed.categoryId,
      });

      props.onBlur?.();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "update_list_item",
        projectId: props.list.projectId,
        listId: props.list.id,
        itemId: props.id,
      });
      toast.error(
        "No s'ha pogut actualitzar l'element, torna-ho a provar més tard",
      );
      return;
    }
  }

  function handleBlur() {
    if (!form.formState.isSubmitting) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <li>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="flex flex-row items-center gap-2"
          ref={formRef}
        >
          <FormField
            control={form.control}
            name="completed"
            render={({ field }) => (
              <FormItem className="flex items-center">
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
              <FormItem className="grow">
                <FormControl>
                  <Input
                    {...field}
                    className={cn(
                      "border-none",
                      form.getValues().completed && "line-through",
                    )}
                    disabled={
                      form.formState.isSubmitting || form.getValues().completed
                    }
                    onBlur={handleBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.isDirty ? (
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
          ) : (
            <div className="w-4" />
          )}
        </form>
      </Form>
    </li>
  );
}
