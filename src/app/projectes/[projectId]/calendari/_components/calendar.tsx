"use client";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ca } from "date-fns/locale";
import React from "react";

export default function Calendar() {
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
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              {date.toLocaleString("ca-ES", {
                dateStyle: "long",
              })}
            </h2>

            <p className="italic opacity-60">
              No hi ha cap esdeveniment programat per aquest dia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
