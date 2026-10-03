"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
import { eventSchema } from "@/app/[locale]/groups/[projectId]/calendar/_components/event/data";
import {
  eventDatesForForm,
  eventDatesForMutation,
} from "@/app/[locale]/groups/[projectId]/calendar/_components/event/date-values";
import EventFormFields from "@/app/[locale]/groups/[projectId]/calendar/_components/event/event-form-fields";
import { useEventDates } from "@/app/[locale]/groups/[projectId]/calendar/_components/event/use-event-dates";
import { Form } from "@/components/ui/form";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { captureException } from "@/lib/error-reporting";

export default function EditEventForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("calendar");
  return (
    <ModalForm
      trigger={trigger}
      title={t("editTitle")}
      description={t("editDescription")}
    >
      <EditEventFormContent event={event} />
    </ModalForm>
  );
}

function EditEventFormContent({ event }: { event: Event }) {
  const form = useForm<v.InferInput<typeof eventSchema>>({
    defaultValues: {
      name: event.name,
      description: event.description ?? "",
      dates: eventDatesForForm(event),
      allDay: event.allDay,
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
        captureException(e, { action: "edit_event" });
        toast.error(t("editError"));
      }
    },
    [event, form, close, t, updateEvent],
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
