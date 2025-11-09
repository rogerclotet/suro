"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
} from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { getTimeString } from "../../get-time-string";
import { createEvent } from "./actions";
import { eventSchema } from "./data";

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

  const selectDefaultTime = useCallback(
    (fromDate: Date, toDate: Date, allDay?: boolean) => {
      const defaultStartAt = new Date(fromDate.getTime());
      const defaultEndAt = new Date(toDate.getTime());

      if (allDay) {
        defaultStartAt.setHours(0, 0, 0, 0);
        defaultEndAt.setHours(0, 0, 0, 0);
      } else {
        const now = new Date();
        defaultStartAt.setHours(now.getHours() + 1, 0, 0, 0);
        defaultEndAt.setHours(now.getHours() + 2, 0, 0, 0);
      }

      form.setValue("dates", {
        from: defaultStartAt,
        to: defaultEndAt,
      });
    },
    [form],
  );

  useEffect(() => {
    selectDefaultTime(defaultDate, defaultDate, true);
  }, [defaultDate, selectDefaultTime]);

  function handleDatesChange(dates: DateRange | undefined) {
    const from = dates?.from ?? new Date();
    const to = dates?.to ?? from;

    selectDefaultTime(from, to, form.getValues("allDay"));
  }

  function handleStartTimeChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const [hour, minute] = value.split(":");
    const newDates = form.getValues("dates");
    if (!newDates.from || !hour || !minute) {
      return;
    }

    newDates.from.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
    if (!newDates.to || newDates.from > newDates.to) {
      newDates.to?.setHours(
        newDates.from.getHours() + 1,
        newDates.from.getMinutes(),
      );
    }

    form.setValue("dates", newDates);
  }

  function handleEndTimeChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const [hour, minute] = value.split(":");
    const newDates = form.getValues("dates");
    if (!newDates.to || !hour || !minute) {
      return;
    }

    newDates.to.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
    if (!newDates.from || newDates.from > newDates.to) {
      newDates.from?.setHours(
        newDates.to.getHours() - 1,
        newDates.to.getMinutes(),
      );
    }

    form.setValue("dates", newDates);
  }

  function handleAllDayChange(checked: CheckedState) {
    if (checked === "indeterminate") {
      return;
    }

    const newDates = form.getValues("dates");
    const fromDate = newDates.from ?? newDates.to ?? new Date();
    const toDate = newDates.to ?? newDates.from ?? new Date();
    selectDefaultTime(fromDate, toDate, checked);

    form.setValue("allDay", checked);
  }

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
  handleDatesChange: (dates: DateRange | undefined) => void;
  handleStartTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleEndTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleAllDayChange: (checked: CheckedState) => void;
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
        await createEvent(dataToCreate, project);
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dates"
          render={({ field }) => (
            <div className="flex flex-row flex-wrap gap-2">
              <FormItem className="grow">
                <FormLabel>Dates</FormLabel>
                <DatePicker
                  dates={field.value as DateRange}
                  onDatesChange={handleDatesChange}
                />
              </FormItem>
              <div className="flex grow flex-row gap-2">
                <FormItem className="w-auto grow">
                  <FormLabel>Hora inici</FormLabel>
                  <Input
                    type="time"
                    disabled={form.getValues().allDay}
                    value={
                      form.getValues().allDay
                        ? ""
                        : getTimeString(field.value?.from)
                    }
                    onChange={handleStartTimeChange}
                    className="justify-center"
                  />
                </FormItem>
                <FormItem className="w-auto grow">
                  <FormLabel>Hora final</FormLabel>
                  <Input
                    type="time"
                    disabled={form.getValues().allDay}
                    value={
                      form.getValues().allDay
                        ? ""
                        : getTimeString(field.value?.to)
                    }
                    onChange={handleEndTimeChange}
                    className="justify-center"
                  />
                </FormItem>
              </div>
            </div>
          )}
        />

        <FormField
          name="allDay"
          render={({ field }) => (
            <FormItem className="flex grow flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={handleAllDayChange}
                />
              </FormControl>
              <FormLabel>Tot el dia</FormLabel>
            </FormItem>
          )}
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
