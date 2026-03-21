"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ca } from "date-fns/locale";
import { CalendarArrowDown, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ComponentProps, useMemo, useState } from "react";
import type { CalendarDay, DayButton, Modifiers } from "react-day-picker";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarComponent,
  CalendarDayButton,
} from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import CreateEventButton from "./event/create-event-button";
import EventPreview from "./event/event-preview";
import getMonthString from "./event/get-month-string";
import { eventsQueryOptions } from "./event/query";

const EVENT_COLORS = 5;

function Events({
  isLoading,
  currentEvents,
}: {
  isLoading: boolean;
  currentEvents: Event[] | undefined;
}) {
  if (isLoading || currentEvents === undefined) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (currentEvents && currentEvents.length === 0) {
    return (
      <p className="italic opacity-60">
        No hi ha cap esdeveniment programat per aquest dia.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {currentEvents.map((event) => (
        <EventPreview key={event.id} event={event} />
      ))}
    </div>
  );
}

export default function Calendar() {
  const searchParams = useSearchParams();
  const day = searchParams.get("d");

  const today = useMemo(() => {
    const today = day ? new Date(day) : new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [day]);

  const monthStart = useMemo(() => {
    const date = day ? new Date(day) : new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(1);
    return date;
  }, [day]);

  const [date, setDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState<Date>(monthStart);
  const { project } = useProjects();
  const { data: events, isLoading } = useQuery(
    eventsQueryOptions(currentMonth, project?.id),
  );
  const queryClient = useQueryClient();
  const router = useRouter();

  const currentEvents = useMemo(
    () => events?.filter((event) => isCurrentDayEvent(event, today)),
    [events, today],
  );

  const eventColors = useMemo(() => {
    if (!events) {
      return new Map();
    }

    const colors = new Map();
    [...events].forEach((event, index) => {
      const color = index % EVENT_COLORS;
      colors.set(event.id, color);
    });
    return colors;
  }, [events]);

  function CustomDayButton({
    className,
    day,
    modifiers,
    ...props
  }: {
    className?: string;
    day: CalendarDay;
    modifiers: Modifiers;
  } & ComponentProps<typeof DayButton>) {
    const dayEvents = events
      ?.filter((event) => isCurrentDayEvent(event, day.date))
      .slice(0, 3);

    return (
      <div className="relative h-9 w-9 overflow-visible">
        <CalendarDayButton
          className="text-sm"
          day={day}
          modifiers={modifiers}
          {...props}
        />

        {dayEvents && dayEvents.length > 0 && (
          <div className="pointer-events-none absolute top-[3px] right-[3px] flex flex-row-reverse gap-px">
            {dayEvents.map((event) => {
              const color = eventColors.get(event.id);
              return (
                <div
                  key={event.id}
                  className={cn(
                    "z-10 h-2 w-2 rounded-full border border-muted/60",
                    // Explictly defining colors to avoid concatenating arbitrary values
                    // https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
                    color === 2
                      ? "bg-event-2"
                      : color === 3
                        ? "bg-event-3"
                        : color === 4
                          ? "bg-event-4"
                          : color === 5
                            ? "bg-event-5"
                            : "bg-event-1",
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  async function handleEventCreated(
    from: Date | undefined,
    to: Date | undefined,
  ) {
    const fromMonth = from ? getMonthString(from) : undefined;
    const toMonth = to ? getMonthString(to) : undefined;

    if (fromMonth) {
      await queryClient.invalidateQueries({
        queryKey: ["events", fromMonth],
      });
    }

    if (toMonth && fromMonth !== toMonth) {
      await queryClient.invalidateQueries({
        queryKey: ["events", toMonth],
      });
    }
  }

  function handleDaySelect(date: Date | undefined) {
    if (date) {
      setDate(date);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      router.replace(`/grups/${project?.id}/calendari?d=${dateString}`);
    }
  }

  async function copyCalendarExportURL() {
    const url = `${window.location.origin}/api/${project?.id}/calendar.ics`;
    await navigator.clipboard.writeText(url);
    toast.info("Copiat al porta-retalls");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-8">
        <div className="flex flex-col items-center">
          <CalendarComponent
            mode="single"
            month={currentMonth}
            selected={date}
            onSelect={handleDaySelect}
            onMonthChange={setCurrentMonth}
            locale={ca}
            className="mx-auto"
            classNames={{
              caption_label: "text-md",
            }}
            components={{
              DayButton: CustomDayButton,
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyCalendarExportURL}
            className="mt-2 w-full gap-2"
          >
            <CalendarArrowDown className="size-4" />
            Exportar calendari
          </Button>
        </div>

        {date && (
          <div className="grow">
            <h2 className="mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold text-xl">
              {date.toLocaleString("ca-ES", {
                dateStyle: "long",
              })}

              <CreateEventButton
                defaultDate={date}
                onCreate={handleEventCreated}
              />
            </h2>

            <Events isLoading={isLoading} currentEvents={currentEvents} />
          </div>
        )}
      </div>
    </div>
  );
}

function isCurrentDayEvent(event: Event, date?: Date) {
  if (!date || !event.startAt || !event.endAt) {
    return false;
  }

  let endAt = event.endAt;
  if (event.allDay) {
    endAt = new Date(endAt.getTime() - 86400000);
  }

  const eventStart = new Date(
    event.startAt.getFullYear(),
    event.startAt.getMonth(),
    event.startAt.getDate(),
  );
  const eventEnd = new Date(
    endAt.getFullYear(),
    endAt.getMonth(),
    endAt.getDate(),
    23,
    59,
    59,
    999,
  );

  return eventStart <= date && eventEnd >= date;
}
