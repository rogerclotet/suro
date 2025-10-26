"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useLogger } from "next-axiom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import ModalForm from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkEventListSchema } from "../../_components/event/data";
import { linkEventList } from "../actions";

export default function LinkListForm({
  event,
  triggerRef,
}: {
  event: Event;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
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
      lists.map<List>((list) => {
        return {
          ...list,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
        };
      });
      return lists as List[];
    },
    select: (data) => data?.filter((list) => list.eventId === null),
    staleTime: 60 * 1000,
  });
  const log = useLogger();

  async function onSubmit(data: v.InferInput<typeof linkEventListSchema>) {
    try {
      await linkEventList(event, data.listId);
      triggerRef.current?.click();
      toast.success("Llista enllaçada correctament");
    } catch (e) {
      captureException(e);
      log.error("Error linking event list", {
        error: e,
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(
        "No s'ha pogut enllaçar la llista. Torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalForm
      triggerRef={triggerRef}
      title="Enllaçar llista"
      description="Selecciona la llista a enllaçar. Un esdeveniment només pot tenir una llista enllaçada, i una llista només pot estar enllaçada a un esdeveniment."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="listId"
            render={({ field }) => (
              <FormItem>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una llista" />
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
            )}
          />

          <Button className="w-full">Enllaçar</Button>
        </form>
      </Form>
    </ModalForm>
  );
}
