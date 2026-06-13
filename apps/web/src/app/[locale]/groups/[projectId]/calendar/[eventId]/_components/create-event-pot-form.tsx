"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PiggyBank } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import type { Event } from "@/app/_data/event";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { useSession } from "@/lib/session";

const eventPotSchema = v.object({
  memberIds: v.pipe(
    v.array(v.string()),
    v.minLength(2, "Cal seleccionar almenys 2 membres"),
  ),
});

/**
 * Asks who's in a new event-linked pot before creating it. The pot inherits the
 * event's name (so there's no name field) and stays linked to the event. Members
 * default to everyone in the group — the prior auto-seed — but can be trimmed.
 */
export default function CreateEventPotForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { project } = useProjects();
  const t = useTranslations("calendar");

  if (!project) {
    return null;
  }

  return (
    <ModalForm
      trigger={trigger}
      title={t("createPotTitle")}
      description={t("createPotDescription")}
    >
      <CreateEventPotFormContent
        event={event}
        project={project}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function CreateEventPotFormContent({
  event,
  project,
  sessionId,
}: {
  event: Event;
  project: Project;
  sessionId?: string;
}) {
  const { close } = useModalForm();
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const createLinkedPot = useMutation(api.events.createLinkedPot);
  const form = useForm<v.InferInput<typeof eventPotSchema>>({
    // Everyone selected by default (matches the previous auto-seed behaviour).
    defaultValues: {
      memberIds: project.users.map((u) => u.user.id),
    },
    resolver: valibotResolver(eventPotSchema),
  });

  async function onSubmit(data: v.InferInput<typeof eventPotSchema>) {
    try {
      await createLinkedPot({
        eventId: event.id as Id<"events">,
        memberIds: data.memberIds as Id<"users">[],
      });
      form.reset();
      toast.success(t("createPotSuccess"));
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "create_event_pot",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("createPotError"));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="memberIds"
          render={() => (
            <FormItem>
              <FormLabel>{tCommon("members")}</FormLabel>
              <div className="space-y-2">
                {project.users.map((u) => (
                  <FormField
                    key={u.user.id}
                    control={form.control}
                    name="memberIds"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(u.user.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, u.user.id]
                                  : current.filter(
                                      (id: string) => id !== u.user.id,
                                    ),
                              );
                            }}
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                        <span className="font-normal text-sm">
                          {u.user.name}
                        </span>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          icon={<PiggyBank />}
          text={tCommon("create")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
