"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ca } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  dates: DateRange;
  onDatesChange: (dates: DateRange | undefined) => void;
};

export function DatePicker({ dates, onDatesChange, className }: Props) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "overflow-ellipsis font-normal",
              !dates && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dates?.from ? (
              dates.to !== undefined && !isSameDay(dates.from, dates.to) ? (
                <>
                  {format(dates.from, "dd LLL", { locale: ca })} -{" "}
                  {format(dates.to, "dd LLL", { locale: ca })}
                </>
              ) : (
                format(dates.from, "dd LLL, y", { locale: ca })
              )
            ) : (
              <span>Tria una data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dates?.from}
            selected={dates}
            onSelect={onDatesChange}
            numberOfMonths={2}
            locale={ca}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
