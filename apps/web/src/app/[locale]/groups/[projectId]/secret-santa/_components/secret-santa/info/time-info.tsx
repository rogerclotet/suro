"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

const TimeInfoComponent = ({ datetime }: { datetime: Date }) => {
  const locale = useLocale();
  const t = useTranslations("secretSanta");

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
    datetime.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  ];

  if (daysToStart === 1) {
    parts.push(t("hoursRemaining", { hours: hoursToStart }));
  } else if (daysToStart > 0) {
    parts.push(t("daysRemaining", { days: daysToStart }));
  }

  return parts.join(" - ");
};

export default dynamic(() => Promise.resolve(TimeInfoComponent), {
  ssr: false,
});
