import type { ChangeEvent } from "react";
import type { DateRange } from "react-day-picker";
import type { UseFormReturn } from "react-hook-form";
import type * as v from "valibot";
import { DatePicker } from "@/components/ui/date-picker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getTimeString } from "../../get-time-string";
import type { eventSchema } from "./data";

type EventFormFieldsProps = {
  form: UseFormReturn<v.InferInput<typeof eventSchema>>;
  handleDatesChange: (dates: DateRange | undefined) => void;
  handleStartTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleEndTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleAllDayChange: (checked: boolean) => void;
};

export default function EventFormFields({
  form,
  handleDatesChange,
  handleStartTimeChange,
  handleEndTimeChange,
  handleAllDayChange,
}: EventFormFieldsProps) {
  return (
    <>
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
    </>
  );
}
