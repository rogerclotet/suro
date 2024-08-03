import type { Spending } from "@/app/_data/spending";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MonetaryAmount from "./monetary-amount";

export default function SpendingLine({ spending }: { spending: Spending }) {
  function DateWithTooltip() {
    const date = new Date(spending.createdAt);
    const dateString = date.toLocaleDateString("ca-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const dateDiff = Math.floor((Date.now() - date.getTime()) / 1000);
    let relativeDate = "";
    if (dateDiff < 60) {
      relativeDate = "ara mateix";
    } else if (dateDiff < 3600) {
      const minutes = Math.floor(dateDiff / 60);
      relativeDate = `fa ${minutes} minut${minutes > 1 ? "s" : ""}`;
    } else if (dateDiff < 86400) {
      const hours = Math.floor(dateDiff / 3600);
      relativeDate = `fa ${hours} ${hours > 1 ? "hores" : "hora"}`;
    } else if (dateDiff < 604800) {
      const days = Math.floor(dateDiff / 86400);
      relativeDate = `fa ${days} ${days > 1 ? "dies" : "dia"}`;
    } else {
      relativeDate = `el ${dateString}`;
    }

    return (
      <Tooltip>
        <TooltipTrigger>{relativeDate}</TooltipTrigger>
        <TooltipContent>{dateString}</TooltipContent>
      </Tooltip>
    );
  }

  if (spending.from !== null && spending.to !== null) {
    return (
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">
          {spending.from.name}
        </span>{" "}
        ha pagat{" "}
        <MonetaryAmount
          amount={spending.amount}
          currency={spending.currency}
          className="font-semibold text-foreground"
        />{" "}
        a{" "}
        <span className="font-semibold text-foreground">
          {spending.to.name}
        </span>{" "}
        <DateWithTooltip />
      </p>
    );
  }

  if (spending.from !== null) {
    return (
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">
          {spending.from.name}
        </span>{" "}
        ha pagat{" "}
        <MonetaryAmount
          amount={spending.amount}
          currency={spending.currency}
          className="font-semibold text-foreground"
        />{" "}
        <DateWithTooltip />
      </p>
    );
  }

  if (spending.to !== null) {
    return (
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">
          {spending.to.name}
        </span>{" "}
        ha rebut{" "}
        <MonetaryAmount
          amount={spending.amount}
          currency={spending.currency}
          className="font-semibold text-foreground"
        />{" "}
        <DateWithTooltip />
      </p>
    );
  }

  return null;
}
