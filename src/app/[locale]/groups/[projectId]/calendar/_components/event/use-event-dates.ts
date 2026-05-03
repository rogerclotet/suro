import type { ChangeEvent } from "react";
import { useCallback } from "react";
import type { DateRange } from "react-day-picker";
import type { UseFormReturn } from "react-hook-form";
import type * as v from "valibot";
import type { eventSchema } from "./data";

type EventFormValues = v.InferInput<typeof eventSchema>;

type UseEventDatesOptions = {
  form: UseFormReturn<EventFormValues>;
  /** When true, changing dates preserves existing hours/minutes (edit mode) */
  preserveTimes?: boolean;
  /** Original event times to restore when toggling allDay off in edit mode */
  originalTimes?: {
    from: Date;
    to: Date;
  };
};

function getNextFullHour(): { hour: number; minute: number } {
  const now = new Date();
  const hour = now.getHours() + 1;
  // Cap at 23:00 if past midnight
  return { hour: Math.min(hour, 23), minute: 0 };
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function useEventDates({
  form,
  preserveTimes = false,
  originalTimes,
}: UseEventDatesOptions) {
  const applyDefaultTimes = useCallback(
    (from: Date, to: Date, allDay: boolean): { from: Date; to: Date } => {
      const newFrom = new Date(from.getTime());
      const newTo = new Date(to.getTime());

      if (allDay) {
        newFrom.setHours(0, 0, 0, 0);
        newTo.setHours(0, 0, 0, 0);
      } else if (preserveTimes && originalTimes) {
        // In edit mode, restore original times
        newFrom.setHours(
          originalTimes.from.getHours(),
          originalTimes.from.getMinutes(),
          0,
          0,
        );
        newTo.setHours(
          originalTimes.to.getHours(),
          originalTimes.to.getMinutes(),
          0,
          0,
        );
      } else {
        // Create mode: next full hour for 1h duration
        const { hour, minute } = getNextFullHour();
        newFrom.setHours(hour, minute, 0, 0);
        newTo.setHours(Math.min(hour + 1, 23), minute, 0, 0);
      }

      return { from: newFrom, to: newTo };
    },
    [preserveTimes, originalTimes],
  );

  const handleDatesChange = useCallback(
    (dates: DateRange | undefined) => {
      const from = dates?.from ?? new Date();
      const to = dates?.to ?? from;
      const currentAllDay = form.getValues("allDay");

      if (preserveTimes && !currentAllDay) {
        // In edit mode with specific times: keep hours, change only date portion
        const currentDates = form.getValues("dates");
        const newFrom = new Date(from.getTime());
        const newTo = new Date(to.getTime());

        if (currentDates.from) {
          newFrom.setHours(
            currentDates.from.getHours(),
            currentDates.from.getMinutes(),
            0,
            0,
          );
        }
        if (currentDates.to) {
          newTo.setHours(
            currentDates.to.getHours(),
            currentDates.to.getMinutes(),
            0,
            0,
          );
        }

        form.setValue("dates", { from: newFrom, to: newTo });
      } else {
        const { from: newFrom, to: newTo } = applyDefaultTimes(
          from,
          to,
          currentAllDay,
        );
        form.setValue("dates", { from: newFrom, to: newTo });
      }
    },
    [form, preserveTimes, applyDefaultTimes],
  );

  const handleStartTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const [hour, minute] = value.split(":");
      const currentDates = form.getValues("dates");
      if (!currentDates.from || !hour || !minute) {
        return;
      }

      const newFrom = new Date(currentDates.from.getTime());
      newFrom.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

      const newTo = currentDates.to
        ? new Date(currentDates.to.getTime())
        : new Date(newFrom.getTime());

      // If start > end on the same day, push end forward
      if (isSameDay(newFrom, newTo) && newFrom > newTo) {
        newTo.setHours(newFrom.getHours() + 1, newFrom.getMinutes(), 0, 0);
      }

      form.setValue("dates", { from: newFrom, to: newTo });
    },
    [form],
  );

  const handleEndTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const [hour, minute] = value.split(":");
      const currentDates = form.getValues("dates");
      if (!currentDates.to || !hour || !minute) {
        return;
      }

      const newTo = new Date(currentDates.to.getTime());
      newTo.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

      const newFrom = currentDates.from
        ? new Date(currentDates.from.getTime())
        : new Date(newTo.getTime());

      // If end < start on the same day, push start backward
      if (isSameDay(newFrom, newTo) && newFrom > newTo) {
        newFrom.setHours(newTo.getHours() - 1, newTo.getMinutes(), 0, 0);
      }

      form.setValue("dates", { from: newFrom, to: newTo });
    },
    [form],
  );

  const handleAllDayChange = useCallback(
    (checked: boolean) => {
      const currentDates = form.getValues("dates");
      const from = currentDates.from ?? currentDates.to ?? new Date();
      const to = currentDates.to ?? currentDates.from ?? new Date();

      const { from: newFrom, to: newTo } = applyDefaultTimes(from, to, checked);

      form.setValue("dates", { from: newFrom, to: newTo });
      form.setValue("allDay", checked);
    },
    [form, applyDefaultTimes],
  );

  return {
    handleDatesChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleAllDayChange,
  };
}
