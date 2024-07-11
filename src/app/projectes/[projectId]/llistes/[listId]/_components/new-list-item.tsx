"use client";

import type { List } from "@/app/_data/list";
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
import { createListItem } from "./actions";
import NewCategoryModal from "./categories/new-category-modal";
import { listItemSchema } from "./data";

export default function NewListItem({ list }: { list: List }) {
  const form = useForm({
    defaultValues: {
      name: "",
      completed: false,
      categoryId: "",
    },
    resolver: valibotResolver(listItemSchema),
  });
  const { project } = useProjects();
  const newCategoryModalRef = React.useRef<HTMLDivElement>(null);

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (data.name === "") {
      return;
    }

    if (data.categoryId === "") {
      data.categoryId = null;
    }

    try {
      await createListItem(list, data);
      form.reset();
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
      form.setValue("categoryId", "");
    } else {
      form.setValue("categoryId", value);
    }
  }

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="ml-6 flex flex-grow items-center gap-2"
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
            name="categoryId"
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
        onCreate={(categoryId) => form.setValue("categoryId", categoryId)}
      />
    </li>
  );
}
