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
import { Loader2, Plus } from "lucide-react";
import React from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { createEvent } from "./actions";
import { eventSchema } from "./data";

export default function CreateEventButton({
  defaultDate,
  onCreate,
}: {
  defaultDate: Date | undefined;
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

  React.useEffect(() => {
    const defaultTime = defaultDate?.getTime();
    const defaultStartAt = defaultTime ? new Date(defaultTime) : new Date();
    const defaultEndAt = defaultTime ? new Date(defaultTime) : new Date();
    defaultStartAt.setDate(defaultStartAt.getDate());
    defaultEndAt.setDate(defaultEndAt.getDate());

    form.setValue("dates", {
      from: defaultStartAt,
      to: defaultEndAt,
    });
  }, [defaultDate, form]);

  async function onSubmit(data: v.InferInput<typeof eventSchema>) {
    try {
      await createEvent(data, project!);
      toast.success(`Esdeveniment ${data.name} creat`);
      onCreate(data.dates.from, data.dates.to);
      form.reset();
      triggerRef.current?.click();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear l'esdeveniment. Torna-ho a provar més tard.");
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

            <Button disabled={form.formState.isSubmitting} className="w-full">
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

function getTimeString(date: Date | undefined) {
  if (!date) {
    return "";
  }

  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}
