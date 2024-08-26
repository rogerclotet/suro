"use client";

import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import ModalForm from "@/components/ui/modal-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { captureException } from "@sentry/nextjs";
import { Loader2, Plus } from "lucide-react";
import { useLogger } from "next-axiom";
import React, { useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
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
  const { project } = useProjects();
  const form = useForm<v.InferInput<typeof eventSchema>>({
    defaultValues: {
      name: "",
      description: "",
      allDay: true,
    },
    resolver: valibotResolver(eventSchema),
  });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const log = useLogger();

  const selectDefaultTime = useCallback(
    (fromDate: Date, toDate: Date, allDay?: boolean) => {
      const defaultStartAt = new Date(fromDate.getTime());
      const defaultEndAt = new Date(toDate.getTime());

      if (allDay) {
        defaultStartAt.setHours(0, 0, 0, 0);
        defaultEndAt.setHours(23, 59, 59, 999);
      } else {
        const now = new Date();
        defaultStartAt.setHours(now.getHours() + 1, 0, 0, 0);
        defaultEndAt.setHours(now.getHours() + 2, 0, 0, 0);
      }

      defaultStartAt.setDate(defaultStartAt.getDate());
      defaultEndAt.setDate(defaultEndAt.getDate());

      form.setValue("dates", {
        from: defaultStartAt,
        to: defaultEndAt,
      });
    },
    [form],
  );

  React.useEffect(() => {
    selectDefaultTime(defaultDate, defaultDate, true);
  }, [defaultDate, selectDefaultTime]);

  async function onSubmit(data: v.InferInput<typeof eventSchema>) {
    try {
      await createEvent(data, project!);
      toast.success(`Esdeveniment ${data.name} creat`);
      onCreate(data.dates.from, data.dates.to);
      form.reset();
      triggerRef.current?.click();
    } catch (e) {
      captureException(e);
      log.error("Error creating event", { error: e, projectId: project?.id });
      toast.error("Error al crear l'esdeveniment. Torna-ho a provar més tard.");
    }
  }

  function handleDatesChange(dates: DateRange | undefined) {
    const from = dates?.from ?? new Date();
    const to = dates?.to ?? from;

    selectDefaultTime(from, to, form.getValues("allDay"));
  }

  function handleStartTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const [hour, minute] = value.split(":");
    const newDates = form.getValues("dates");
    if (!newDates.from) {
      return;
    }

    newDates.from.setHours(parseInt(hour!), parseInt(minute!), 0, 0);
    if (!newDates.to || newDates.from > newDates.to) {
      newDates.to?.setHours(
        newDates.from.getHours() + 1,
        newDates.from.getMinutes(),
      );
    }

    form.setValue("dates", newDates);
  }

  function handleEndTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const [hour, minute] = value.split(":");
    const newDates = form.getValues("dates");
    if (!newDates.to) {
      return;
    }

    newDates.to.setHours(parseInt(hour!), parseInt(minute!), 0, 0);
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
    selectDefaultTime(
      newDates.from ?? newDates.to!,
      newDates.to ?? newDates.from!,
      checked,
    );

    form.setValue("allDay", checked);
  }

  return (
    <>
      <Button onClick={() => triggerRef.current?.click()} className="gap-2">
        <Plus /> Crear esdeveniment
      </Button>

      <ModalForm
        triggerRef={triggerRef}
        title="Crear esdeveniment"
        description="Crear un esdeveniment nou"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormItem className="flex-grow">
                    <FormLabel>Dates</FormLabel>
                    <DatePicker
                      dates={field.value as DateRange}
                      onDatesChange={handleDatesChange}
                    />
                  </FormItem>
                  <div className="flex flex-grow flex-row gap-2">
                    <FormItem className="w-auto flex-grow">
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
                    <FormItem className="w-auto flex-grow">
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
                <FormItem className="flex flex-grow flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value as boolean}
                      onCheckedChange={handleAllDayChange}
                    />
                  </FormControl>
                  <FormLabel>Tot el dia</FormLabel>
                </FormItem>
              )}
            />

            <Button
              disabled={form.formState.isSubmitting}
              className="w-full space-x-2"
            >
              {form.formState.isSubmitting && (
                <Loader2 className="animate-spin" />
              )}
              Crear
            </Button>
          </form>
        </Form>
      </ModalForm>
    </>
  );
}
