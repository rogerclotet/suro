"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useQuery } from "@tanstack/react-query";
import { LinkIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
import type { Pot } from "@/app/_data/pot";
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
import { linkEventPotSchema } from "../../_components/event/data";
import { linkEventPot } from "../actions";

export default function LinkPotForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");
  const form = useForm({
    defaultValues: {
      potId: "",
    },
    resolver: valibotResolver(linkEventPotSchema),
  });
  const { project } = useProjects();
  const { data: pots } = useQuery({
    queryKey: ["pots", project?.id],
    queryFn: async () => {
      if (!project) {
        return [];
      }
      const res = await fetch(`/api/${project.id}/pots`);
      if (!res.ok) {
        throw new Error(t("linkPotLoadError"));
      }
      const pots = (await res.json()) as (Pot & {
        createdAt: string;
        settledAt: string | null;
      })[];
      return pots.map<Pot>((pot) => {
        return {
          ...pot,
          createdAt: new Date(pot.createdAt),
          settledAt: pot.settledAt ? new Date(pot.settledAt) : null,
        };
      });
    },
    select: (data) =>
      data?.filter((pot) => pot.eventId === null && pot.settledAt === null),
    staleTime: 60 * 1000,
  });

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof linkEventPotSchema>) => {
      try {
        await linkEventPot(event, data.potId);
        toast.success(t("linkPotSuccess"));
      } catch (e) {
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "link_event_pot",
          projectId: event.projectId,
          eventId: event.id,
        });
        toast.error(t("linkPotError"));
      }
    },
    [event, session?.user.id, t],
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
      title={t("linkPotTitle")}
      description={t("linkPotDescription")}
    >
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="potId"
            render={({ field }) => {
              return (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger disabled={!pots || pots.length === 0}>
                        <SelectValue
                          placeholder={
                            pots && pots.length > 0
                              ? t("linkPotPlaceholder")
                              : t("linkPotNoPots")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pots?.map((pot) => (
                        <SelectItem key={pot.id} value={pot.id}>
                          {pot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />

          <SubmitButton
            text={t("linkPotButton")}
            icon={<LinkIcon />}
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
