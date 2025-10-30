"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
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
  SelectValue,
} from "@/components/ui/select";
import NewCategoryModal from "../../../[listId]/_components/categories/new-category-modal";
import { templateItemSchema } from "../../_components/create-template/data";
import { createTemplateItem } from "./actions";

type Item = Template["items"][number];

export default function NewTemplateItem({
  template,
  onCreate,
}: {
  template: Template;
  onCreate: (item: Item) => void;
}) {
  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useProjects();
  const newCategoryModalRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    if (data.name === "") {
      return;
    }

    if (data.category === "") {
      data.category = null;
    }

    try {
      await createTemplateItem(template, data);
      onCreate({ name: data.name, category: data.category ?? null });
      form.reset({ name: "", category: data.category ?? "" });
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_template_item",
        projectId: template.projectId,
        templateId: template.id,
      });
      toast.error("No s'ha pogut crear l'element, torna-ho a provar més tard");
      return;
    }
  }

  function handleCategoryChange(value: string) {
    if (value === "new") {
      newCategoryModalRef.current?.click();
      return;
    }

    if (value === "-") {
      form.setValue("category", "");
    } else {
      form.setValue("category", value);
    }
  }

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex grow items-center gap-2"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grow">
                <FormControl>
                  <Input
                    placeholder="Nou element"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </FormControl>
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value ?? undefined}
                  onValueChange={handleCategoryChange}
                  disabled={form.formState.isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sense categoria" />
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
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <NewCategoryModal
        triggerRef={newCategoryModalRef}
        onCreate={(categoryId) => form.setValue("category", categoryId)}
      />
    </li>
  );
}
