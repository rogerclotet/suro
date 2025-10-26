"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { captureException } from "@sentry/nextjs";
import { Loader2 } from "lucide-react";
import { useLogger } from "next-axiom";
import React from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
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
        to: event.allDay
          ? new Date(event.endAt.getTime() - 86400000)
          : event.endAt,
      },
      allDay: event.allDay,
    },
    resolver: valibotResolver(eventSchema),
  });
  const log = useLogger();

  const selectDefaultTime = React.useCallback(
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

  async function onSubmit(data: v.InferInput<typeof eventSchema>) {
    const dataToEdit = window.structuredClone(data);
    if (dataToEdit.allDay) {
      dataToEdit.dates.from = new Date(
        Date.UTC(
          data.dates.from?.getFullYear() ?? 0,
          data.dates.from?.getMonth() ?? 0,
          data.dates.from?.getDate() ?? 0,
        ),
      );
      dataToEdit.dates.to = new Date(
        Date.UTC(
          data.dates.to?.getFullYear() ?? 0,
          data.dates.to?.getMonth() ?? 0,
          data.dates.to?.getDate() ?? 0,
        ),
      );
    }

    try {
      await editEvent(event, dataToEdit, project!);
      toast.success("Editat correctament");
      form.reset({
        name: data.name,
        description: data.description ?? "",
        dates: { from: data.dates.from, to: data.dates.to },
        allDay: data.allDay,
      });
      triggerRef.current?.click();
    } catch (e) {
      captureException(e);
      log.error("Error editing event", {
        error: e,
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error("Error editant l'esdeveniment. Torna-ho a provar més tard");
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
