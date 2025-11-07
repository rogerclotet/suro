"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import Action from "@/components/action";
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
import ModalForm from "@/components/ui/modal-form";
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof templateSchema>) {
    try {
      const templateId = await createTemplate(projectId, data);
      toast.success(`Plantilla ${form.getValues().name} creada`);
      triggerRef.current?.click();
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
    <>
      <Action
        label="Crear plantilla"
        icon={PlusIcon}
        pathParts={["llistes", "plantilles"]}
        onClick={() => triggerRef.current?.click()}
      />

      <ModalForm
        triggerRef={triggerRef}
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

            <Button
              disabled={form.formState.isSubmitting}
              className="w-full space-x-2"
            >
              {form.formState.isSubmitting && (
                <span className="loading loading-spinner" />
              )}
              Crear
            </Button>
          </form>
        </Form>
      </ModalForm>
    </>
  );
}
