"use client";

import "@/styles/calendar.css";
import { ca } from "date-fns/locale";
import React from "react";
import RLCalendar from "react-lightweight-calendar";
import { CurrentView } from "react-lightweight-calendar/dist/components/Calendar/Calendar.types";

type Event = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  bgColor?: string;
  textColor?: string;
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]!,
  );
  const [events, setEvents] = React.useState<Event[]>([]);
  const [view, setView] = React.useState<CurrentView>(CurrentView.WEEK_TIME);

  function addEvent(event: Event) {
    setEvents((prevEvents) => [...prevEvents, event]);
  }

  return (
    <div className="calendar">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Calendari</h1>
        <div className="flex items-center gap-2">
          Vista:
          <select
            value={view}
            onChange={(e) => setView(e.target.value as CurrentView)}
            className="select"
          >
            <option value={CurrentView.WEEK_TIME}>Setmana</option>
            <option value={CurrentView.MONTH}>Mes</option>
          </select>
        </div>
      </div>

      <RLCalendar
        data={[...events]}
        currentView={view}
        currentDate={currentDate}
        setCurrentDate={(date) => setCurrentDate(date as string)}
        activeTimeDateField="startTime-endTime" // Or just startTime or just endTime
        weekStartsOn={1} // Monday
        timeDateFormat={{
          day: "EE",
          hour: "HH:mm",
          monthYear: "LLLL yyyy",
        }}
        locale={ca}
        renderItemText={(item) => (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold">{item.title}</div>
            <div className="text-xs">
              {new Date(item.startTime as string).toLocaleTimeString("ca-ES", {
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {new Date(item.endTime as string).toLocaleTimeString("ca-ES", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}
        onCellClick={(value) => {
          const endTime = new Date(value.timeDateUTC);
          endTime.setHours((value.hour ?? 0) + 1);

          addEvent({
            id: Math.random().toString(),
            startTime: value.timeDateUTC,
            endTime: endTime.toISOString(),
            title: "Esdeveniment de prova",
          });
        }}
      />
    </div>
  );
}
