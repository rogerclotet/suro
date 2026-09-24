"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { createEventDateDraft } from "domain/events";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import { Form } from "@/components/ui/form";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { useSession } from "@/lib/session";
import { eventSchema } from "./data";
import { eventDatesForMutation } from "./date-values";
import EventFormFields from "./event-form-fields";
import { useEventDates } from "./use-event-dates";

export default function CreateEventButton({
  defaultDate,
  onCreate,
}: {
  defaultDate: Date;
  onCreate?: (from: Date | undefined, to: Date | undefined) => void;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");

  const { project } = useProjects();
  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label={t("createTitle")} />}
      title={t("createTitle")}
      description={t("createDescription")}
    >
      <CreateEventFormContent
        project={project}
        onCreate={onCreate}
        sessionId={session?.user.id}
        defaultDate={defaultDate}
      />
    </ModalForm>
  );
}

function CreateEventFormContent({
  project,
  onCreate,
  sessionId,
  defaultDate,
}: {
  project: Project | null;
  onCreate?: (from: Date | undefined, to: Date | undefined) => void;
  sessionId?: string;
  defaultDate: Date;
}) {
  const form = useForm<v.InferInput<typeof eventSchema>>({
    defaultValues: {
      name: "",
      description: "",
      allDay: true,
      dates: createEventDateDraft(defaultDate).dates,
    },
    resolver: valibotResolver(eventSchema),
  });
  const {
    handleDatesChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleAllDayChange,
  } = useEventDates({ form });
  const { close } = useModalForm();
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const tLists = useTranslations("lists");
  const createEvent = useMutation(api.events.create);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof eventSchema>) => {
      if (!project) {
        toast.error(tLists("noProjectSelected"));
        return;
      }

      const dates = eventDatesForMutation(data);
      if (!dates) return;

      try {
        await createEvent({
          projectId: project.id as Id<"projects">,
          name: data.name,
          description: data.description,
          ...dates,
        });
        toast.success(t("createSuccess", { name: data.name }));
        onCreate?.(data.dates.from, data.dates.to);
        form.reset();
        close();
      } catch (e) {
        posthog.captureException(e, {
          distinctId: sessionId,
          action: "create_event",
          projectId: project?.id,
        });
        toast.error(t("createError"));
      }
    },
    [project, onCreate, form, sessionId, close, t, tLists, createEvent],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <EventFormFields
          form={form}
          handleDatesChange={handleDatesChange}
          handleStartTimeChange={handleStartTimeChange}
          handleEndTimeChange={handleEndTimeChange}
          handleAllDayChange={handleAllDayChange}
        />

        <SubmitButton
          icon={<PlusIcon />}
          text={tCommon("create")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
