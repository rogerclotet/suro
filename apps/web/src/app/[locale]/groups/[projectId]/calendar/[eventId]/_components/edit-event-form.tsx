"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
import {
  eventDatesForForm,
  eventDatesForMutation,
} from "@/app/[locale]/groups/[projectId]/calendar/_components/event/date-values";
import EventFormFields from "@/app/[locale]/groups/[projectId]/calendar/_components/event/event-form-fields";
import { useEventDates } from "@/app/[locale]/groups/[projectId]/calendar/_components/event/use-event-dates";
import { Form } from "@/components/ui/form";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { useSession } from "@/lib/session";
import { eventSchema } from "../../_components/event/data";

export default function EditEventForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");
  const form = useForm<v.InferInput<typeof eventSchema>>({
    defaultValues: {
      name: event.name,
      description: event.description ?? "",
      dates: eventDatesForForm(event),
      allDay: event.allDay,
    },
    resolver: valibotResolver(eventSchema),
  });

  const handlers = useEventDates({
    form,
    preserveTimes: true,
    originalTimes: { from: event.startAt, to: event.endAt },
  });

  return (
    <ModalForm
      trigger={trigger}
      title={t("editTitle")}
      description={t("editDescription")}
    >
      <EditEventFormContent
        form={form}
        event={event}
        sessionId={session?.user.id}
        {...handlers}
      />
    </ModalForm>
  );
}

function EditEventFormContent({
  form,
  event,
  sessionId,
  handleDatesChange,
  handleStartTimeChange,
  handleEndTimeChange,
  handleAllDayChange,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof eventSchema>>>;
  event: Event;
  sessionId?: string;
  handleDatesChange: Parameters<typeof EventFormFields>[0]["handleDatesChange"];
  handleStartTimeChange: Parameters<
    typeof EventFormFields
  >[0]["handleStartTimeChange"];
  handleEndTimeChange: Parameters<
    typeof EventFormFields
  >[0]["handleEndTimeChange"];
  handleAllDayChange: Parameters<
    typeof EventFormFields
  >[0]["handleAllDayChange"];
}) {
  const { close } = useModalForm();
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const updateEvent = useMutation(api.events.update);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof eventSchema>) => {
      const dates = eventDatesForMutation(data);
      if (!dates) return;

      try {
        await updateEvent({
          eventId: event.id as Id<"events">,
          name: data.name,
          description: data.description,
          ...dates,
        });
        toast.success(t("editSuccess"));
        form.reset({
          name: data.name,
          description: data.description ?? "",
          dates: { from: data.dates.from, to: data.dates.to },
          allDay: data.allDay,
        });
        close();
      } catch (e) {
        posthog.captureException(e, {
          distinctId: sessionId,
          action: "edit_event",
          projectId: event.projectId,
          eventId: event.id,
        });
        toast.error(t("editError"));
      }
    },
    [event, form, sessionId, close, t, updateEvent],
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
          icon={<SaveIcon />}
          text={tCommon("save")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
