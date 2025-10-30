"use client";

import React from "react";
import type { Spending } from "@/app/_data/spending";
import MonetaryAmount from "./monetary-amount";

export default function SpendingLine({ spending }: { spending: Spending }) {
  const [createdAt, setCreatedAt] = React.useState<Date>();

  React.useEffect(() => {
    setCreatedAt(spending.createdAt);
  }, [spending.createdAt]);

  function getDisplayDate() {
    if (!createdAt) {
      return null;
    }

    const date = new Date(createdAt);
    // if it's the same day as now
    const isToday =
      date.getFullYear() === new Date().getFullYear() &&
      date.getMonth() === new Date().getMonth() &&
      date.getDate() === new Date().getDate();

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

    const dateDiff = Math.floor((Date.now() - date.getTime()) / 1000);
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
  }

  function UserPaid() {
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

  function PaidTo() {
    if (spending.to === null) {
      return null;
    }

    return (
      <>
        a{" "}
        <span className="font-semibold text-foreground">
          {spending.to.name}
        </span>
      </>
    );
  }

  function UserReceived() {
    if (spending.to === null) {
      return null;
    }

    return (
      <>
        <span className="font-semibold text-foreground">
          {spending.to.name}
        </span>{" "}
        ha rebut{" "}
        <MonetaryAmount
          amount={spending.amount}
          currency={spending.currency}
          className="font-semibold text-foreground"
        />
      </>
    );
  }

  function Description() {
    if (spending.description === null || spending.description === "") {
      return null;
    }

    return (
      <>
        per <span className="text-foreground">{spending.description}</span>
      </>
    );
  }

  if (spending.from !== null && spending.to !== null) {
    return (
      <span className="text-muted-foreground">
        <UserPaid /> <PaidTo /> <Description /> {getDisplayDate()}
      </span>
    );
  }

  if (spending.from !== null) {
    return (
      <span className="text-muted-foreground">
        <UserPaid /> <Description /> {getDisplayDate()}
      </span>
    );
  }

  if (spending.to !== null) {
    return (
      <span className="text-muted-foreground">
        <UserReceived /> <Description /> {getDisplayDate()}
      </span>
    );
  }

  return null;
}
