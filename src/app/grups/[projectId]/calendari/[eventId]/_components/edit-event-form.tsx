"use client";

import type { Event } from "@/app/_data/event";
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
import { type CheckedState } from "@radix-ui/react-checkbox";
import { captureException } from "@sentry/nextjs";
import { Loader2 } from "lucide-react";
import React from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { eventSchema } from "../../_components/event/data";
import { getTimeString } from "../../get-time-string";
import { editEvent } from "../actions";

export default function EditEventForm({
  event,
  triggerRef,
}: {
  event: Event;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
  const { project } = useProjects();
  const form = useForm<v.InferInput<typeof eventSchema>>({
    defaultValues: {
      name: event.name,
      description: event.description ?? "",
      dates: {
        from: event.startAt,
        to: event.endAt,
      },
      allDay: isAllDay(event.startAt, event.endAt),
    },
    resolver: valibotResolver(eventSchema),
  });

  async function onSubmit(data: v.InferInput<typeof eventSchema>) {
    try {
      await editEvent(event, data, project!);
      toast.success("Editat correctament");
      form.reset({
        name: data.name,
        description: data.description ?? "",
        dates: { from: data.dates.from, to: data.dates.to },
        allDay:
          data.dates.from &&
          data.dates.to &&
          isAllDay(data.dates.from, data.dates.to),
      });
      triggerRef.current?.click();
    } catch (e) {
      captureException(e);
      console.error(e);
      toast.error("Error editant l'esdeveniment. Torna-ho a provar més tard");
    }
  }

  function handleDatesChange(dates: DateRange | undefined) {
    const from = dates?.from;
    const to = dates?.to ?? dates?.from;

    if (form.getValues().allDay) {
      from?.setHours(0, 0, 0, 0);
      to?.setHours(23, 59, 59, 999);
    }

    form.setValue("dates", {
      from,
      to,
    });
  }

  function handleStartTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const [hour, minute] = value.split(":");
    const newDates = form.getValues("dates");
    newDates.from?.setHours(parseInt(hour!), parseInt(minute!), 0, 0);
    form.setValue("dates", newDates);
  }

  function handleEndTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const [hour, minute] = value.split(":");
    const newDates = form.getValues("dates");
    newDates.to?.setHours(parseInt(hour!), parseInt(minute!), 0, 0);
    form.setValue("dates", newDates);
  }

  function handleAllDayChange(checked: CheckedState) {
    if (checked === "indeterminate") {
      return;
    }

    if (checked) {
      const newDates = form.getValues("dates");
      newDates.from?.setHours(0, 0, 0, 0);
      newDates.to?.setHours(23, 59, 59, 999);
      form.setValue("dates", newDates);
    }

    form.setValue("allDay", checked);
  }

  return (
    <ModalForm
      triggerRef={triggerRef}
      title="Editar esdeveniment"
      description="Editar el nom i descripció de l'esdeveniment"
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
            className="w-full gap-2"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="animate-spin" />
            )}
            Desar
          </Button>
        </form>
      </Form>
    </ModalForm>
  );
}

function isAllDay(from: Date, to: Date) {
  return (
    from.getHours() === 0 &&
    from.getMinutes() === 0 &&
    from.getSeconds() === 0 &&
    to.getHours() === 23 &&
    to.getMinutes() === 59 &&
    to.getSeconds() === 59
  );
}

