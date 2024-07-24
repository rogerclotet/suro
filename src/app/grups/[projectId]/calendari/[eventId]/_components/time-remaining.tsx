"use client";

import type { Event } from "@/app/_data/event";
import React from "react";

export default function TimeRemaining({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
  const [timeRemaining, setTimeRemaining] = React.useState<React.ReactNode>();

  React.useEffect(() => {
    const now = new Date();
    const remainingMs = event.startAt.getTime() - now.getTime();

    if (remainingMs < 0) {
      return void {};
    }

    const oneHour = 1000 * 60 * 60;
    const oneDay = oneHour * 24;
    const days = Math.floor(remainingMs / oneDay);
    const hours = Math.floor((remainingMs % oneDay) / oneHour);

    if (days > 0) {
      if (days > 2 || hours === 0) {
        setTimeRemaining(<span className={className}>Falten {days} dies</span>);
        return () => void {};
      } else {
        setTimeRemaining(
          <span className={className}>
            Falten {days} dies i {hours} hores
          </span>,
        );
        return () => void {};
      }
    }

    if (hours > 1) {
      setTimeRemaining(<span className={className}>Falten {hours} hores</span>);
      return () => void {};
    }

    const minutes = Math.floor(remainingMs / (1000 * 60));

    if (hours > 0) {
      setTimeRemaining(
        <span className={className}>Falta 1 hora i {minutes} minuts</span>,
      );
      return () => void {};
    }

    if (minutes > 0) {
      setTimeRemaining(
        <span className={className}>Falten {minutes} minuts</span>,
      );
    }
  }, [className, event.startAt]);

  return timeRemaining;
}
