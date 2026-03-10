"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useQuery } from "@tanstack/react-query";
import { LinkIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import ModalForm from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/ui/submit-button";
import { linkEventListSchema } from "../../_components/event/data";
import { linkEventList } from "../actions";

export default function LinkListForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const form = useForm({
    defaultValues: {
      listId: "",
    },
    resolver: valibotResolver(linkEventListSchema),
  });
  const { project } = useProjects();
  const { data: lists } = useQuery({
    queryKey: ["lists", project?.id],
    queryFn: async () => {
      if (!project) {
        return [];
      }
      const res = await fetch(`/api/${project.id}/lists`);
      if (!res.ok) {
        throw new Error("No s'ha pogut obtenir la llista");
      }
      const lists = (await res.json()) as (List & {
        createdAt: string;
        updatedAt: string;
      })[];
      return lists.map<List>((list) => {
        return {
          ...list,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
        };
      });
    },
    select: (data) => data?.filter((list) => list.eventId === null),
    staleTime: 60 * 1000,
  });

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof linkEventListSchema>) => {
      try {
        await linkEventList(event, data.listId);
        toast.success("Llista enllaçada correctament");
      } catch (e) {
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "link_event_list",
          projectId: event.projectId,
          eventId: event.id,
        });
        toast.error(
          "No s'ha pogut enllaçar la llista. Torna-ho a provar més tard",
        );
      }
    },
    [event, session?.user.id],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <ModalForm
      trigger={trigger}
      title="Enllaçar llista"
      description="Selecciona la llista a enllaçar. Un esdeveniment només pot tenir una llista enllaçada, i una llista només pot estar enllaçada a un esdeveniment."
    >
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="listId"
            render={({ field }) => {
              return (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger disabled={!lists || lists.length === 0}>
                        <SelectValue
                          placeholder={
                            lists && lists.length > 0
                              ? "Selecciona una llista"
                              : "No hi ha llistes disponibles"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lists?.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />

          <SubmitButton
            text="Enllaçar"
            icon={<LinkIcon />}
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
