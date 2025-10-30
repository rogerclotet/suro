"use client";

import { useMemo } from "react";
import type { Event } from "@/app/_data/event";

export default function TimeRemaining({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
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
        return <span className={className}>Falten {days} dies</span>;
      } else {
        return (
          <span className={className}>
            Falten {days} dies i {hours} hores
          </span>
        );
      }
    }

    if (hours > 1) {
      return <span className={className}>Falten {hours} hores</span>;
    }

    const minutes = Math.floor(remainingMs / (1000 * 60));

    if (hours > 0) {
      return <span className={className}>Falta 1 hora i {minutes} minuts</span>;
    }

    if (minutes > 0) {
      return <span className={className}>Falten {minutes} minuts</span>;
    }

    return null;
  }, [className, event.startAt]);

  return timeRemaining;
}
