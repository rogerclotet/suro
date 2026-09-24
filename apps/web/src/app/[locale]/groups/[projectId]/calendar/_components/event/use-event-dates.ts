import {
  changeEventDays,
  changeEventEnd,
  changeEventStart,
  type EventDateDraft,
  type EventDates,
  toggleEventAllDay,
} from "domain/events";
import { type ChangeEvent, useRef } from "react";
import type { DateRange } from "react-day-picker";
import type { UseFormReturn } from "react-hook-form";
import type * as v from "valibot";
import type { eventSchema } from "./data";

type EventFormValues = v.InferInput<typeof eventSchema>;

export function useEventDates({
  form,
}: {
  form: UseFormReturn<EventFormValues>;
}) {
  const timedDates = useRef<EventDates | null>(null);
  function currentDraft(): EventDateDraft {
    const value = form.getValues();
    const from = value.dates?.from ?? new Date();
    const dates = { from, to: value.dates?.to ?? from };
    return value.allDay
      ? { allDay: true, dates, timedDates: timedDates.current }
      : { allDay: false, dates };
  }
  function apply(draft: EventDateDraft) {
    timedDates.current = draft.allDay ? draft.timedDates : draft.dates;
    form.setValue("allDay", draft.allDay, { shouldDirty: true });
    form.setValue("dates", draft.dates, { shouldDirty: true });
  }
  function handleDatesChange(dates: DateRange | undefined) {
    if (!dates?.from) return;
    apply(
      changeEventDays(currentDraft(), {
        from: dates.from,
        to: dates.to ?? dates.from,
      }),
    );
  }
  function changeTime(
    event: ChangeEvent<HTMLInputElement>,
    endpoint: "from" | "to",
  ) {
    if (!event.target.value) return;
    const [hour, minute] = event.target.value.split(":").map(Number);
    if (
      hour === undefined ||
      minute === undefined ||
      !Number.isFinite(hour) ||
      !Number.isFinite(minute)
    )
      return;
    const draft = currentDraft();
    const next = new Date(draft.dates[endpoint]);
    next.setHours(hour, minute, 0, 0);
    apply({
      allDay: false,
      dates:
        endpoint === "from"
          ? changeEventStart(draft.dates, next)
          : changeEventEnd(draft.dates, next),
    });
  }
  return {
    handleDatesChange,
    handleStartTimeChange: (event: ChangeEvent<HTMLInputElement>) =>
      changeTime(event, "from"),
    handleEndTimeChange: (event: ChangeEvent<HTMLInputElement>) =>
      changeTime(event, "to"),
    handleAllDayChange: (checked: boolean) =>
      apply(toggleEventAllDay(currentDraft(), checked)),
  };
}
