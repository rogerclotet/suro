"use client";

import type { List } from "@/app/_data/list";
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
import { valibotResolver } from "@hookform/resolvers/valibot";
import { captureException } from "@sentry/nextjs";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { listSchema } from "../../../_components/create-list/data";
import { updateList } from "./actions";

export default function EditListForm({
  list,
  onClose,
}: {
  list: List;
  onClose: () => void;
}) {
  const form = useForm({
    defaultValues: {
      name: list.name,
      description: list.description ?? "",
    },
    resolver: valibotResolver(listSchema),
  });

  async function onSubmit(data: v.InferInput<typeof listSchema>) {
    try {
      await updateList(list, data);
      toast.success(`Llista ${data.name} actualitzada`);
    } catch (e) {
      captureException(e);
      console.error(e);
      toast.error(
        "No s'ha pogut actualitzar la llista, torna-ho a provar més tard",
      );
    } finally {
      onClose();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripció</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          disabled={form.formState.isSubmitting}
          className="w-full space-x-2"
        >
          {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
          Desar
        </Button>
      </form>
    </Form>
  );
}
