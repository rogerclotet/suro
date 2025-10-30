"use client";

import { useEffect, useMemo, useState } from "react";
import type { Spending } from "@/app/_data/spending";
import MonetaryAmount from "./monetary-amount";

function UserPaid({ spending }: { spending: Spending }) {
  if (spending.from === null) {
    return null;
  }

  return (
    <>
      <span className="font-semibold text-foreground">
        {spending.from.name}
      </span>{" "}
      ha pagat{" "}
      <MonetaryAmount
        amount={spending.amount}
        currency={spending.currency}
        className="font-semibold text-foreground"
      />
    </>
  );
}

function PaidTo({ spending }: { spending: Spending }) {
  if (spending.to === null) {
    return null;
  }

  return (
    <>
      a{" "}
      <span className="font-semibold text-foreground">{spending.to.name}</span>
    </>
  );
}

function UserReceived({ spending }: { spending: Spending }) {
  if (spending.to === null) {
    return null;
  }

  return (
    <>
      <span className="font-semibold text-foreground">{spending.to.name}</span>{" "}
      ha rebut{" "}
      <MonetaryAmount
        amount={spending.amount}
        currency={spending.currency}
        className="font-semibold text-foreground"
      />
    </>
  );
}

function Description({ spending }: { spending: Spending }) {
  if (spending.description === null || spending.description === "") {
    return null;
  }

  return (
    <>
      per <span className="text-foreground">{spending.description}</span>
    </>
  );
}

export default function SpendingLine({ spending }: { spending: Spending }) {
  const [createdAt, setCreatedAt] = useState<Date>();
  const [now] = useState(() => Date.now());

  useEffect(() => {
    setCreatedAt(spending.createdAt);
  }, [spending.createdAt]);

  const displayDate = useMemo(() => {
    if (!createdAt) {
      return null;
    }

    const date = new Date(createdAt);
    // if it's the same day as now
    const nowDate = new Date(now);
    const isToday =
      date.getFullYear() === nowDate.getFullYear() &&
      date.getMonth() === nowDate.getMonth() &&
      date.getDate() === nowDate.getDate();

    const dateString = isToday
      ? `${date.toLocaleTimeString("ca-ES", {
          timeStyle: "short",
          hour12: false,
        })} d'avui`
      : `${date.toLocaleTimeString("ca-ES", {
          timeStyle: "short",
          hour12: false,
        })} del ${date.toLocaleDateString("ca-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;

    const dateDiff = Math.floor((now - date.getTime()) / 1000);
    if (dateDiff < 60) {
      return "ara mateix";
    } else if (dateDiff < 3600) {
      const minutes = Math.floor(dateDiff / 60);
      return `fa ${minutes} minut${minutes > 1 ? "s" : ""}`;
    } else if (dateDiff < 86400) {
      const hours = Math.floor(dateDiff / 3600);
      return `fa ${hours} ${hours > 1 ? "hores" : "hora"} (${dateString})`;
    } else if (dateDiff < 604800) {
      const days = Math.floor(dateDiff / 86400);
      return `fa ${days} ${days > 1 ? "dies" : "dia"} (${dateString})`;
    }

    return `el ${dateString}`;
  }, [createdAt, now]);

  if (spending.from !== null && spending.to !== null) {
    return (
      <span className="text-muted-foreground">
        <UserPaid spending={spending} /> <PaidTo spending={spending} />{" "}
        <Description spending={spending} /> {displayDate}
      </span>
    );
  }

  if (spending.from !== null) {
    return (
      <span className="text-muted-foreground">
        <UserPaid spending={spending} /> <Description spending={spending} />{" "}
        {displayDate}
      </span>
    );
  }

  if (spending.to !== null) {
    return (
      <span className="text-muted-foreground">
        <UserReceived spending={spending} /> <Description spending={spending} />{" "}
        {displayDate}
      </span>
    );
  }

  return null;
}
