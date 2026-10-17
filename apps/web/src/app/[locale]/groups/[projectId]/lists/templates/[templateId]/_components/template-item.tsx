"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check, Loader2 } from "lucide-react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { type FocusEvent, type Ref, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { ROW_PRESENCE } from "@/components/motion/list-transitions";
import { Button } from "@/components/ui/button";
import CategoryPicker from "@/components/ui/category-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { captureException } from "@/lib/error-reporting";
import { templateItemSchema } from "../../_components/create-template/data";

export default function TemplateItem({
  item,
  onChange,
  ref,
}: {
  template: Template;
  item: Template["items"][number];
  onChange: (name: string, category: string | null) => Promise<void>;
  /** Set by AnimatePresence to pop the row out of the flow on exit. */
  ref?: Ref<HTMLLIElement>;
}) {
  const form = useForm({
    defaultValues: {
      name: item.name,
      category: item.category,
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useProjects();
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("lists");

  async function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    try {
      await onChange(data.name, data.category);

      form.reset({ name: data.name, category: data.category });
    } catch (e) {
      captureException(e, { action: "update_template_item" });
      toast.error(t("itemCreateError"));
      return;
    }
  }

  async function handleNameBlur(_e: FocusEvent<HTMLInputElement>) {
    if (form.formState.isDirty) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <m.li
      ref={ref}
      layout="position"
      {...ROW_PRESENCE}
      className="flex w-full items-center justify-between"
    >
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
            render={({ field: { onChange: onFieldChange, value } }) => (
              <FormItem>
                <FormControl>
                  <CategoryPicker
                    variant="ghost"
                    categories={project?.categories ?? []}
                    value={value ?? null}
                    onChange={(category) => {
                      onFieldChange(category);
                      formRef.current?.requestSubmit();
                    }}
                    disabled={form.formState.isSubmitting}
                    className="w-auto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </m.li>
  );
}
