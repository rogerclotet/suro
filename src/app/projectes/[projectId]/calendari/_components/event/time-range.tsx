import { ClientOnly } from "@/components/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  startAt: Date;
  endAt: Date;
  className?: string;
};

export default function TimeRange(props: Props) {
  return (
    <ClientOnly
      fallback={<Skeleton className={cn("mt-1 h-4 w-20", props.className)} />}
    >
      <ClientTimeRange {...props} />
    </ClientOnly>
  );
}

function ClientTimeRange({ startAt, endAt, className }: Props) {
  if (isDayStart(startAt)) {
    if (isDayEnd(endAt)) {
      if (isSameDay(endAt, startAt)) {
        return (
          <span className={className}>
            {startAt.toLocaleDateString("ca-ES", {
              dateStyle: "medium",
            })}
          </span>
        );
      }

      return (
        <span className={className}>
          {startAt.toLocaleString("ca-ES", {
            dateStyle: "medium",
          })}
          {" - "}
          {endAt.toLocaleString("ca-ES", {
            dateStyle: "medium",
          })}
        </span>
      );
    }
  }

  if (isSameDay(startAt, endAt)) {
    return (
      <span className={className}>
        {startAt.toLocaleString("ca-ES", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        {" - "}
        {endAt.toLocaleString("ca-ES", {
          timeStyle: "short",
        })}
      </span>
    );
  }

  return (
    <span className={className}>
      {startAt.toLocaleString("ca-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
      {" - "}
      {endAt.toLocaleString("ca-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </span>
  );
}

function isDayStart(date: Date) {
  return (
    date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
  );
}

function isDayEnd(date: Date) {
  return (
    date.getHours() === 23 &&
    date.getMinutes() === 59 &&
    date.getSeconds() === 59
  );
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
