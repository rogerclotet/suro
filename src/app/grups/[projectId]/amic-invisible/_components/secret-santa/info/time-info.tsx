"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const TimeInfoComponent = ({ datetime }: { datetime: Date }) => {
  const daysToStart = useMemo(() => {
    const now = new Date();
    const diffTime = datetime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [datetime]);

  const hoursToStart = useMemo(() => {
    const now = new Date();
    const diffTime = datetime.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  }, [datetime]);

  const parts = [
    datetime.toLocaleDateString("ca-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  ];

  if (daysToStart === 1) {
    parts.push(`Falten ${hoursToStart} hores!`);
  } else if (daysToStart > 0) {
    parts.push(`Falten ${daysToStart} dies!`);
  }

  return parts.join(" - ");
};

export default dynamic(() => Promise.resolve(TimeInfoComponent), {
  ssr: false,
});
