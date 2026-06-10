"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
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
import { useSession } from "@/lib/session";
import { linkEventPotSchema } from "../../_components/event/data";

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
  const potsData = useQuery(
    api.expenses.listPots,
    project ? { projectId: project.id as Id<"projects"> } : "skip",
  );
  const pots = potsData?.filter(
    (pot) => pot.eventId === undefined && pot.settledAt === undefined,
  );
  const linkPot = useMutation(api.events.linkPot);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof linkEventPotSchema>) => {
      try {
        await linkPot({
          eventId: event.id as Id<"events">,
          potId: data.potId as Id<"pots">,
        });
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
    [event, session?.user.id, t, linkPot],
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
                        <SelectItem key={pot._id} value={pot._id}>
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
