"use client";

import type { Event } from "@/app/_data/event";
import { useProjects } from "@/app/_state/project-state";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ca } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import React from "react";
import type { DayContentProps } from "react-day-picker";
import CreateEventButton from "./event/create-event-button";
import EventDetails from "./event/event-preview";
import getMonthString from "./event/get-month-string";
import { eventsQueryOptions } from "./event/query";

export default function Calendar() {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [monthStart, setMonthStart] = React.useState<Date>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(1);
    return date;
  });
  const { project } = useProjects();
  const { data: events, isLoading } = useQuery(
    eventsQueryOptions(monthStart, project?.id),
  );
  const queryClient = useQueryClient();

  const currentEvents = events?.filter((event) =>
    isCurrentDayEvent(event, date),
  );

  function Events() {
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
          <EventDetails key={event.id} event={event} />
        ))}
      </div>
    );
  }

  function DayContent(props: DayContentProps) {
    const hasEvent = events?.some((event) =>
      isCurrentDayEvent(event, props.date),
    );

    return (
      <span className="relative overflow-visible">
        {hasEvent && (
          <div className="event-indicator absolute -right-[8px] -top-[5px] h-2 w-2 rounded-full bg-secondary" />
        )}

        {props.date.getDate()}
      </span>
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
    }
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Calendari</h1>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-8">
        <div className="flex flex-col items-center">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            onMonthChange={setMonthStart}
            locale={ca}
            className="mx-auto"
            classNames={{
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-md focus-within:relative focus-within:z-20",
            }}
            components={{
              DayContent: DayContent,
            }}
          />
        </div>

        {date && (
          <div className="flex-grow">
            <h2 className="mb-4 flex flex-wrap items-center justify-between gap-4 text-xl font-semibold">
              {date.toLocaleString("ca-ES", {
                dateStyle: "long",
              })}

              <CreateEventButton
                defaultDate={date}
                onCreate={handleEventCreated}
              />
            </h2>

            <Events />
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

  const eventStart = new Date(
    event.startAt.getFullYear(),
    event.startAt.getMonth(),
    event.startAt.getDate(),
  );
  const eventEnd = new Date(
    event.endAt.getFullYear(),
    event.endAt.getMonth(),
    event.endAt.getDate(),
    23,
    59,
    59,
  );

  return eventStart <= date && eventEnd >= date;
}
