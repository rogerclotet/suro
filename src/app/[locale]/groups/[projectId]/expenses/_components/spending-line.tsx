"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Spending } from "@/app/_data/spending";
import MonetaryAmount from "./monetary-amount";

type T = ReturnType<typeof useTranslations<"expenses">>;

function UserPaid({ spending, t }: { spending: Spending; t: T }) {
  if (spending.from === null) {
    return null;
  }

  return (
    <>
      <span className="font-semibold text-foreground">
        {spending.from.name}
      </span>{" "}
      {t("spendingPaid")}{" "}
      <MonetaryAmount
        amount={spending.amount}
        currency={spending.currency}
        className="font-semibold text-foreground"
      />
    </>
  );
}

function PaidTo({ spending, t }: { spending: Spending; t: T }) {
  if (spending.to === null) {
    return null;
  }

  return (
    <>
      {t("spendingTo")}{" "}
      <span className="font-semibold text-foreground">{spending.to.name}</span>
    </>
  );
}

function UserReceived({ spending, t }: { spending: Spending; t: T }) {
  if (spending.to === null) {
    return null;
  }

  return (
    <>
      <span className="font-semibold text-foreground">{spending.to.name}</span>{" "}
      {t("spendingReceived")}{" "}
      <MonetaryAmount
        amount={spending.amount}
        currency={spending.currency}
        className="font-semibold text-foreground"
      />
    </>
  );
}

function Description({ spending, t }: { spending: Spending; t: T }) {
  if (spending.description === null || spending.description === "") {
    return null;
  }

  return (
    <>
      {t("spendingFor")}{" "}
      <span className="text-foreground">{spending.description}</span>
    </>
  );
}

export default function SpendingLine({ spending }: { spending: Spending }) {
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
    } else if (dateDiff < 3600) {
      return rtf.format(-Math.floor(dateDiff / 60), "minute");
    } else if (dateDiff < 86400) {
      return `${rtf.format(-Math.floor(dateDiff / 3600), "hour")} (${timestamp})`;
    } else if (dateDiff < 604800) {
      return `${rtf.format(-Math.floor(dateDiff / 86400), "day")} (${timestamp})`;
    }

    return t("spendingLongAgo", { date: timestamp });
  }, [spending.createdAt, now, locale, t]);

  if (spending.from !== null && spending.to !== null) {
    return (
      <span className="text-muted-foreground">
        <UserPaid spending={spending} t={t} />{" "}
        <PaidTo spending={spending} t={t} />{" "}
        <Description spending={spending} t={t} /> {displayDate}
      </span>
    );
  }

  if (spending.from !== null) {
    return (
      <span className="text-muted-foreground">
        <UserPaid spending={spending} t={t} />{" "}
        <Description spending={spending} t={t} /> {displayDate}
      </span>
    );
  }

  if (spending.to !== null) {
    return (
      <span className="text-muted-foreground">
        <UserReceived spending={spending} t={t} />{" "}
        <Description spending={spending} t={t} /> {displayDate}
      </span>
    );
  }

  return null;
}
