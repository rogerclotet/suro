"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import Action from "@/components/action";
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
import { createTemplate } from "./actions";
import { templateSchema } from "./data";

export default function CreateTemplateButton({
  projectId,
}: {
  projectId: string;
}) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      items: [],
    },
    resolver: valibotResolver(templateSchema),
  });
  const router = useRouter();
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof templateSchema>) {
    try {
      const templateId = await createTemplate(projectId, data);
      toast.success(`Plantilla ${form.getValues().name} creada`);
      router.push(`/grups/${projectId}/llistes/plantilles/${templateId}`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_template",
        projectId,
      });
      toast.error(
        "No s'ha pogut crear la plantilla, torna-ho a provar més tard",
      );
      return;
    } finally {
      form.reset();
    }
  }

  return (
    <ModalForm
      trigger={
        <Action
          label="Crear plantilla"
          icon={PlusIcon}
          pathParts={["llistes", "plantilles"]}
        />
      }
      title="Crear plantilla"
      description="Crear una plantilla nova"
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
            icon={<PlusIcon />}
            text="Crear"
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
