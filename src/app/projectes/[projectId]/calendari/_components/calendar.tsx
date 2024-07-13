"use client";

import type { Event } from "@/app/_data/event";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ca } from "date-fns/locale";
import React from "react";
import CreateEventButton from "./event/create-event-button";

export default function Calendar({ events }: { events: Event[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

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
            onSelect={setDate}
            locale={ca}
            className="mx-auto"
          />
        </div>

        {date && (
          <div className="flex-grow">
            <h2 className="mb-4 flex flex-wrap items-center justify-between gap-4 text-xl font-semibold">
              {date.toLocaleString("ca-ES", {
                dateStyle: "long",
              })}

              <CreateEventButton />
            </h2>

            {events.length === 0 ? (
              <p className="italic opacity-60">
                No hi ha cap esdeveniment programat per aquest dia.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription>
                        {event.startAt.toLocaleString("ca-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {" - "}
                        {event.endAt.toLocaleString("ca-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </CardDescription>
                    </CardHeader>
                    {event.description && (
                      <CardContent>{event.description}</CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
