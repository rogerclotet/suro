"use client";

import { useMemo } from "react";

export default function TimeRange({
  startAt,
  endAt,
  allDay,
  className,
}: {
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  className?: string;
}) {
  const range = useMemo(() => {
    if (allDay) {
      const allDayEndAt = new Date(
        endAt.getFullYear(),
        endAt.getMonth(),
        endAt.getDate() - 1,
      );

      if (isSameDay(allDayEndAt, startAt)) {
        return (
          <span className={className}>
            {startAt.toLocaleDateString("ca-ES", {
              dateStyle: "medium",
            })}
          </span>
        );
      }

      return (
        <span className={className}>
          {startAt.toLocaleString("ca-ES", {
            dateStyle: "medium",
          })}
          {" - "}
          {allDayEndAt.toLocaleString("ca-ES", {
            dateStyle: "medium",
          })}
        </span>
      );
    }

    if (isSameDay(startAt, endAt)) {
      return (
        <span className={className}>
          {startAt.toLocaleString("ca-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {" - "}
          {endAt.toLocaleString("ca-ES", {
            timeStyle: "short",
          })}
        </span>
      );
    }

    return (
      <span className={className}>
        {startAt.toLocaleString("ca-ES", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        {" - "}
        {endAt.toLocaleString("ca-ES", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </span>
    );
  }, [startAt, endAt, allDay, className]);

  return range;
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
