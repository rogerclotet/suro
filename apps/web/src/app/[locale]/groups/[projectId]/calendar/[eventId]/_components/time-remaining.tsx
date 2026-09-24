"use client";

import { timeRemainingParts } from "domain/events";
import { useTranslations } from "next-intl";
import type { Event } from "@/app/_data/event";
import { eventTimes } from "@/lib/event-day";

export default function TimeRemaining({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
  const t = useTranslations("calendar");
  const remaining = timeRemainingParts(eventTimes(event), Date.now());
  if (!remaining) return null;
  let label: string;
  switch (remaining.kind) {
    case "days":
      label = t("timeRemainingDays", { days: remaining.days });
      break;
    case "daysHours":
      label = t("timeRemainingDaysHours", {
        days: remaining.days,
        hours: remaining.hours,
      });
      break;
    case "hours":
      label = t("timeRemainingHours", { hours: remaining.hours });
      break;
    case "oneHourMinutes":
      label = t("timeRemainingOneHourMinutes", { minutes: remaining.minutes });
      break;
    case "minutes":
      label = t("timeRemainingMinutes", { minutes: remaining.minutes });
      break;
  }
  return <span className={className}>{label}</span>;
}
