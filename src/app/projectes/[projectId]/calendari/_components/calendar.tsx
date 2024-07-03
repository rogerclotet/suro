"use client";

import React from "react";
import ReactCalendar from "react-calendar";
import "src/styles/calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Calendar() {
  const [value, setValue] = React.useState<Value>(new Date());

  return (
    <div className="calendar mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Calendari</h1>
      </div>

      <ReactCalendar
        value={value}
        onChange={setValue}
        locale="ca-ES"
        className="mx-auto mb-8 max-w-[600px] rounded-xl bg-base-300 p-1 shadow-lg"
      />

      {value && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            {value.toLocaleString("ca-ES", {
              dateStyle: "long",
            })}
          </h2>

          <p className="italic opacity-60">
            No hi ha cap esdeveniment programat per aquest dia.
          </p>
        </div>
      )}
    </div>
  );
}
