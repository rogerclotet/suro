"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Event } from "@/app/_data/event";

export default function TimeRemaining({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
  const t = useTranslations("calendar");

  const timeRemaining = useMemo(() => {
    const now = new Date();
    const remainingMs = event.startAt.getTime() - now.getTime();

    if (remainingMs < 0) {
      return null;
    }

    const oneHour = 1000 * 60 * 60;
    const oneDay = oneHour * 24;
    const days = Math.floor(remainingMs / oneDay);
    const hours = Math.floor((remainingMs % oneDay) / oneHour);

    if (days > 0) {
      if (days > 2 || hours === 0) {
        return (
          <span className={className}>{t("timeRemainingDays", { days })}</span>
        );
      } else {
        return (
          <span className={className}>
            {t("timeRemainingDaysHours", { days, hours })}
          </span>
        );
      }
    }

    if (hours > 1) {
      return (
        <span className={className}>{t("timeRemainingHours", { hours })}</span>
      );
    }

    const minutes = Math.floor(remainingMs / (1000 * 60));

    if (hours > 0) {
      return (
        <span className={className}>
          {t("timeRemainingOneHourMinutes", { minutes })}
        </span>
      );
    }

    if (minutes > 0) {
      return (
        <span className={className}>
          {t("timeRemainingMinutes", { minutes })}
        </span>
      );
    }

    return null;
  }, [className, event.startAt, t]);

  return timeRemaining;
}
