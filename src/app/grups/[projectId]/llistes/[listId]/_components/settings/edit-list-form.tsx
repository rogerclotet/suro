"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { List } from "@/app/_data/list";
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
import SubmitButton from "@/components/ui/submit-button";
import { listSchema } from "../../../_components/create-list/data";
import { updateList } from "./actions";

export default function EditListForm({
  list,
  trigger,
}: {
  list: List;
  trigger: ReactNode;
}) {
  const form = useForm({
    defaultValues: {
      name: list.name,
      description: list.description ?? "",
    },
    resolver: valibotResolver(listSchema),
  });
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof listSchema>) {
    try {
      await updateList(list, data);
      toast.success(`Llista ${data.name} actualitzada`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "update_list",
        projectId: list.projectId,
        listId: list.id,
      });
      toast.error(
        "No s'ha pogut actualitzar la llista, torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalForm
      trigger={trigger}
      title="Editar llista"
      description="Editar el nom i la descripció de la llista"
    >
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

          <SubmitButton
            icon={<SaveIcon />}
            text="Desar"
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
