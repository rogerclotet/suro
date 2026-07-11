"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Spending } from "@/app/_data/spending";
import MonetaryAmount from "./monetary-amount";

export default function SoloSpendingLine({ spending }: { spending: Spending }) {
  const [now] = useState(() => Date.now());
  const locale = useLocale();
  const t = useTranslations("expenses");

  const displayDate = useMemo(() => {
    if (!spending.createdAt) {
      return null;
    }

    const date = new Date(spending.createdAt);
    const nowDate = new Date(now);
    const isToday =
      date.getFullYear() === nowDate.getFullYear() &&
      date.getMonth() === nowDate.getMonth() &&
      date.getDate() === nowDate.getDate();

    const time = date.toLocaleTimeString(locale, {
      timeStyle: "short",
      hour12: false,
    });
    const dateStr = date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const timestamp = isToday
      ? t("spendingTimestampToday", { time })
      : t("spendingTimestampDate", { time, date: dateStr });

    const dateDiff = Math.floor((now - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });

    if (dateDiff < 60) {
      return t("spendingJustNow");
    }
    if (dateDiff < 3600) {
      return rtf.format(-Math.floor(dateDiff / 60), "minute");
    }
    if (dateDiff < 86400) {
      return `${rtf.format(-Math.floor(dateDiff / 3600), "hour")} (${timestamp})`;
    }
    if (dateDiff < 604800) {
      return `${rtf.format(-Math.floor(dateDiff / 86400), "day")} (${timestamp})`;
    }

    return t("spendingLongAgo", { date: timestamp });
  }, [spending.createdAt, now, locale, t]);

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">
          {spending.description?.trim() ? (
            spending.description
          ) : (
            <span className="text-muted-foreground italic">
              {t("soloUntitledSpending")}
            </span>
          )}
        </p>
        {displayDate ? (
          <p className="text-muted-foreground text-sm">{displayDate}</p>
        ) : null}
      </div>
      <MonetaryAmount
        amount={spending.amount}
        currency={spending.currency}
        className="shrink-0 font-semibold text-foreground tabular-nums"
      />
    </div>
  );
}
