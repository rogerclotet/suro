"use client";

import { eventDatesForForm, sameDay } from "domain/events";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { eventTimes } from "@/lib/event-day";

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
      const { from: start, to: allDayEndAt } = eventDatesForForm(
        eventTimes({ startAt, endAt, allDay }),
      );

      if (sameDay(allDayEndAt, start)) {
        return (
          <span className={className}>
            {start.toLocaleDateString(locale, {
              dateStyle: "medium",
            })}
          </span>
        );
      }

      return (
        <span className={className}>
          {start.toLocaleString(locale, {
            dateStyle: "medium",
          })}
          {" - "}
          {allDayEndAt.toLocaleString(locale, {
            dateStyle: "medium",
          })}
        </span>
      );
    }

    if (sameDay(startAt, endAt)) {
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
