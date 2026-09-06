import type { ChangeEvent } from "react";
import { useCallback } from "react";
import type { DateRange } from "react-day-picker";
import type { UseFormReturn } from "react-hook-form";
import type * as v from "valibot";
import type { eventSchema } from "./data";
import { selectEventDays } from "./date-values";

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

/** Push `to` forward so it is at least 1 hour after `from` (may cross midnight). */
function ensureMinimumDuration(from: Date, to: Date): Date {
  const minEnd = new Date(from.getTime());
  minEnd.setHours(from.getHours() + 1, from.getMinutes(), 0, 0);
  return to.getTime() < minEnd.getTime() ? minEnd : to;
}

export function useEventDates({
  form,
  preserveTimes = false,
  originalTimes,
}: UseEventDatesOptions) {
  const applyDefaultTimes = useCallback(
    (from: Date, to: Date, allDay: boolean): { from: Date; to: Date } => {
      return selectEventDays(
        from,
        to,
        allDay,
        preserveTimes ? originalTimes : undefined,
      );
    },
    [preserveTimes, originalTimes],
  );

  const handleDatesChange = useCallback(
    (dates: DateRange | undefined) => {
      const from = dates?.from ?? new Date();
      const to = dates?.to ?? from;
      const currentAllDay = form.getValues("allDay");

      if (preserveTimes && !currentAllDay) {
        const currentDates = form.getValues("dates");
        const times =
          currentDates.from && currentDates.to
            ? { from: currentDates.from, to: currentDates.to }
            : undefined;
        form.setValue("dates", selectEventDays(from, to, false, times));
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

      let newTo = currentDates.to
        ? new Date(currentDates.to.getTime())
        : new Date(newFrom.getTime());

      // Keep end at least 1h after start (same day or spilling to next).
      if (newFrom.getTime() >= newTo.getTime()) {
        newTo = ensureMinimumDuration(newFrom, newTo);
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

      let newFrom = currentDates.from
        ? new Date(currentDates.from.getTime())
        : new Date(newTo.getTime());

      // If end is not after start, pull start back by 1h.
      if (newFrom.getTime() >= newTo.getTime()) {
        newFrom = new Date(newTo.getTime());
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
