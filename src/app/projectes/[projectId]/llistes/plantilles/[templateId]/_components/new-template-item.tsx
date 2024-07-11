"use client";

import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
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
import { valibotResolver } from "@hookform/resolvers/valibot";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import NewCategoryModal from "../../../[listId]/_components/categories/new-category-modal";
import { templateItemSchema } from "../../_components/create-template/data";
import { createTemplateItem } from "./actions";

export default function NewTemplateItem({ template }: { template: Template }) {
  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
    },
    resolver: valibotResolver(templateItemSchema),
  });
  const { project } = useProjects();
  const newCategoryModalRef = React.useRef<HTMLDivElement>(null);

  async function onSubmit(data: v.InferInput<typeof templateItemSchema>) {
    if (data.name === "") {
      return;
    }

    if (data.category === "") {
      data.category = null;
    }

    try {
      await createTemplateItem(template, data);
      form.reset({ name: "" });
    } catch (e) {
      console.error(e);
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
          className="flex flex-grow items-center gap-2"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input placeholder="Nou element" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value}
                  onValueChange={handleCategoryChange}
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
