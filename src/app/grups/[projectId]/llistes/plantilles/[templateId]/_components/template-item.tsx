"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Loader2, Tag } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FocusEvent, useRef } from "react";
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
} from "@/components/ui/select";
import NewCategoryModal from "../../../[listId]/_components/categories/new-category-modal";
import { templateItemSchema } from "../../_components/create-template/data";

export default function TemplateItem({
  template,
  item,
  onChange,
}: {
  template: Template;
  item: Template["items"][number];
  onChange: (name: string, category: string | null) => Promise<void>;
}) {
  const form = useForm({
    defaultValues: {
      name: item.name,
      category: item.category,
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useProjects();
  const newCategoryModalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    try {
      await onChange(data.name, data.category);

      form.reset({ name: data.name, category: data.category });
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "update_template_item",
        projectId: project?.id,
        templateId: template.id,
      });
      toast.error("No s'ha pogut crear l'element, torna-ho a provar més tard");
      return;
    }
  }

  async function handleNameBlur(_e: FocusEvent<HTMLInputElement>) {
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
    <li className="flex w-full items-center justify-between">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-row items-start gap-2"
          ref={formRef}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grow">
                <FormControl>
                  <Input
                    {...field}
                    onBlur={(e) => handleNameBlur(e)}
                    disabled={form.formState.isSubmitting}
                    className="h-10"
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
              className={form.formState.isDirty ? "" : "hidden"}
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
            render={({ field: { onChange, value } }) => (
              <FormItem>
                <FormControl>
                  <Select
                    value={value ?? ""}
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
        onCreate={(categoryId) => form.setValue("category", categoryId)}
      />
    </li>
  );
}
