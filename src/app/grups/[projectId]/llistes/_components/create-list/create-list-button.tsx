"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { useProjects } from "@/app/_state/project-state";
import { getTemplates } from "@/app/api/[projectId]/templates/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm from "@/components/ui/modal-form";
import { createList } from "./actions";
import { listSchema } from "./data";

export default function CreateListButton({ projectId }: { projectId: string }) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      templates: [] as string[],
    },
    resolver: valibotResolver(listSchema),
  });
  const router = useRouter();
  const { project } = useProjects();
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const { data: templates } = useQuery({
    queryKey: ["templates", projectId],
    queryFn: () => getTemplates(projectId),
    staleTime: 60 * 1000,
  });
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof listSchema>) {
    if (!project) {
      toast.error("No s'ha seleccionat cap projecte");
      return;
    }

    try {
      const listId = await createList(project, data);
      toast.success(`Llista ${form.getValues().name} creada`);
      router.push(`/grups/${projectId}/llistes/${listId}`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_list",
        projectId,
      });
      toast.error("No s'ha pogut crear la llista, torna-ho a provar més tard");
    } finally {
      form.reset();
    }
  }

  function CreateButton({ onClick }: { onClick?: () => void }) {
    return (
      <Button onClick={onClick} variant="default" size="sm" className="gap-2">
        <Plus />
        Crear llista
      </Button>
    );
  }

  if (!project || templates === undefined) {
    return <CreateButton />;
  }

  return (
    <>
      <CreateButton onClick={() => triggerRef.current?.click()} />

      <ModalForm
        triggerRef={triggerRef}
        title="Crear llista"
        description="Crear una llista nova"
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
                    <Input {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {templates.length > 0 && (
              <FormField
                control={form.control}
                name="templates"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Incloure plantilles</FormLabel>
                      <FormDescription>
                        {
                          "S'inclouran els elements de les plantilles seleccionades a la nova llista"
                        }
                      </FormDescription>
                    </div>
                    {templates.map((template) => (
                      <FormField
                        key={template.id}
                        control={form.control}
                        name="templates"
                        render={({ field }) => (
                          <FormItem key={template.id}>
                            <div className="flex flex-row items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(template.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value ?? []),
                                          template.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== template.id,
                                          ),
                                        );
                                  }}
                                  disabled={form.formState.isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {template.name} ({template.items.length}{" "}
                                elements)
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
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
