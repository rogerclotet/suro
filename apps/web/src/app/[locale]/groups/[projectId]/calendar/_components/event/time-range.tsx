"use client";

import { useLocale } from "next-intl";
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
  const locale = useLocale();

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
            {startAt.toLocaleDateString(locale, {
              dateStyle: "medium",
            })}
          </span>
        );
      }

      return (
        <span className={className}>
          {startAt.toLocaleString(locale, {
            dateStyle: "medium",
          })}
          {" - "}
          {allDayEndAt.toLocaleString(locale, {
            dateStyle: "medium",
          })}
        </span>
      );
    }

    if (isSameDay(startAt, endAt)) {
      return (
        <span className={className}>
          {startAt.toLocaleString(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {" - "}
          {endAt.toLocaleString(locale, {
            timeStyle: "short",
          })}
        </span>
      );
    }

    return (
      <span className={className}>
        {startAt.toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        {" - "}
        {endAt.toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </span>
    );
  }, [startAt, endAt, allDay, className, locale]);

  return range;
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
