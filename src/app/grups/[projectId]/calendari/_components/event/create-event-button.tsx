"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import { Form } from "@/components/ui/form";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { createEventOffline } from "@/lib/offline/offline-events";
import { eventSchema } from "./data";
import EventFormFields from "./event-form-fields";
import { useEventDates } from "./use-event-dates";

export default function CreateEventButton({
  defaultDate,
  onCreate,
}: {
  defaultDate: Date;
  onCreate: (from: Date | undefined, to: Date | undefined) => void;
}) {
  const { data: session } = useSession();

  const { project } = useProjects();
  const form = useForm<v.InferInput<typeof eventSchema>>({
    defaultValues: {
      name: "",
      description: "",
      allDay: true,
    },
    resolver: valibotResolver(eventSchema),
  });

  const {
    handleDatesChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleAllDayChange,
  } = useEventDates({ form, preserveTimes: false });

  useEffect(() => {
    const date = new Date(defaultDate.getTime());
    date.setHours(0, 0, 0, 0);
    form.setValue("dates", { from: date, to: date });
    form.setValue("allDay", true);
  }, [defaultDate, form]);

  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label="Crear esdeveniment" />}
      title="Crear esdeveniment"
      description="Crear un esdeveniment nou"
    >
      <CreateEventFormContent
        form={form}
        project={project}
        onCreate={onCreate}
        sessionId={session?.user.id}
        handleDatesChange={handleDatesChange}
        handleStartTimeChange={handleStartTimeChange}
        handleEndTimeChange={handleEndTimeChange}
        handleAllDayChange={handleAllDayChange}
      />
    </ModalForm>
  );
}

function CreateEventFormContent({
  form,
  project,
  onCreate,
  sessionId,
  handleDatesChange,
  handleStartTimeChange,
  handleEndTimeChange,
  handleAllDayChange,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof eventSchema>>>;
  project: Project | null;
  onCreate: (from: Date | undefined, to: Date | undefined) => void;
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

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof eventSchema>) => {
      if (!project) {
        toast.error("No s'ha seleccionat cap projecte");
        return;
      }

      const dataToCreate = window.structuredClone(data);
      if (dataToCreate.allDay) {
        dataToCreate.dates.from = new Date(
          Date.UTC(
            data.dates.from?.getFullYear() ?? 0,
            data.dates.from?.getMonth() ?? 0,
            data.dates.from?.getDate() ?? 0,
          ),
        );
        dataToCreate.dates.to = new Date(
          Date.UTC(
            data.dates.to?.getFullYear() ?? 0,
            data.dates.to?.getMonth() ?? 0,
            data.dates.to?.getDate() ?? 0,
          ),
        );
      }

      try {
        await createEventOffline(
          {
            name: dataToCreate.name,
            description: dataToCreate.description,
            dates: {
              from: dataToCreate.dates.from!,
              to: dataToCreate.dates.to!,
            },
            allDay: dataToCreate.allDay,
          },
          project,
        );
        toast.success(`Esdeveniment ${data.name} creat`);
        onCreate(data.dates.from, data.dates.to);
        form.reset();
        close();
      } catch (e) {
        posthog.captureException(e, {
          distinctId: sessionId,
          action: "create_event",
          projectId: project?.id,
        });
        toast.error(
          "Error al crear l'esdeveniment. Torna-ho a provar més tard.",
        );
      }
    },
    [project, onCreate, form, sessionId, close],
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
          text="Crear"
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
