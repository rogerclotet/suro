"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { CalendarArrowDown, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ComponentProps, useMemo, useState } from "react";
import type { CalendarDay, DayButton, Modifiers } from "react-day-picker";
import { toast } from "sonner";
import type { CalendarEvent } from "@/app/_data/event";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarComponent,
  CalendarDayButton,
} from "@/components/ui/calendar";
import type { Locale } from "@/i18n/routing";
import {
  type AppDateLocale,
  getDateFnsLocaleForUi,
  parseDateOnly,
} from "@/lib/date-locale";
import { useEventsInRange } from "@/lib/queries/use-events";
import { cn } from "@/lib/utils";
import CreateEventButton from "./event/create-event-button";
import EventPreview from "./event/event-preview";
import { getMonthEnd } from "./event/month-range";

// Per-event accent dots cycle through the palette's five accents, mirroring
// the mobile calendar (apps/mobile, calendar/index.tsx). On the selected
// day's primary fill the on-primary set — the opposite brightness — keeps
// the dots legible against the green.
const EVENT_DOT_CLASSES = [
  "bg-event-1",
  "bg-event-2",
  "bg-event-3",
  "bg-event-4",
  "bg-event-5",
] as const;
const EVENT_DOT_ON_PRIMARY_CLASSES = [
  "bg-event-on-primary-1",
  "bg-event-on-primary-2",
  "bg-event-on-primary-3",
  "bg-event-on-primary-4",
  "bg-event-on-primary-5",
] as const;

function Events({
  isLoading,
  currentEvents,
}: {
  isLoading: boolean;
  currentEvents: CalendarEvent[] | undefined;
}) {
  const t = useTranslations("calendar");

  if (isLoading || currentEvents === undefined) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (currentEvents.length === 0) {
    return <p className="italic opacity-60">{t("noEventsForDay")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {currentEvents.map((event) => (
        <EventPreview key={event.id} event={event} />
      ))}
    </div>
  );
}

export default function Calendar({
  dateLocale,
}: {
  dateLocale: AppDateLocale;
}) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const uiLocale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const currentPathname = usePathname();
  const day = searchParams.get("d");

  const today = useMemo(() => {
    const today = day ? parseDateOnly(day) : new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [day]);

  const monthStart = useMemo(() => {
    const date = day ? parseDateOnly(day) : new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(1);
    return date;
  }, [day]);

  const [date, setDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState<Date>(monthStart);
  const { project } = useProjects();
  const monthEnd = useMemo(() => getMonthEnd(currentMonth), [currentMonth]);
  const events = useEventsInRange(project?.id, currentMonth, monthEnd);
  const router = useRouter();
  const getCalendarToken = useMutation(api.events.getOrCreateCalendarToken);

  const currentEvents = useMemo(
    () => events?.filter((event) => isCurrentDayEvent(event, date)),
    [events, date],
  );

  const eventColors = useMemo(() => {
    if (!events) {
      return new Map<string, number>();
    }

    const colors = new Map<string, number>();
    [...events].forEach((event, index) => {
      colors.set(event.id, index % EVENT_DOT_CLASSES.length);
    });
    return colors;
  }, [events]);

  function CustomDayButton({
    className,
    day,
    modifiers,
    ...props
  }: {
    className?: string;
    day: CalendarDay;
    modifiers: Modifiers;
  } & ComponentProps<typeof DayButton>) {
    const dayEvents = events
      ?.filter((event) => isCurrentDayEvent(event, day.date))
      .slice(0, 3);

    return (
      <div className="relative h-9 w-9 overflow-visible">
        <CalendarDayButton
          className="text-sm"
          day={day}
          modifiers={modifiers}
          dateLocale={dateLocale}
          {...props}
        />

        {dayEvents && dayEvents.length > 0 && (
          /* Bottom-centered 5px dots, like the mobile month grid. */
          <div className="pointer-events-none absolute bottom-[3px] left-1/2 flex -translate-x-1/2 gap-0.5">
            {dayEvents.map((event) => {
              const color = eventColors.get(event.id) ?? 0;
              const dotClasses = modifiers.selected
                ? EVENT_DOT_ON_PRIMARY_CLASSES
                : EVENT_DOT_CLASSES;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "z-10 h-[5px] w-[5px] rounded-full",
                    dotClasses[color],
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function handleDaySelect(date: Date | undefined) {
    if (date) {
      setDate(date);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      router.replace(`${currentPathname}?d=${dateString}`);
    }
  }

  async function copyCalendarExportURL() {
    if (!project?.id) {
      return;
    }
    const token = await getCalendarToken({
      projectId: project.id as Id<"projects">,
    });
    // The .ics feed is served by the Convex HTTP actions domain (.convex.site).
    const siteUrl = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(
      ".convex.cloud",
      ".convex.site",
    );
    const url = `${siteUrl}/calendar.ics?projectId=${project.id}&token=${token}`;
    await navigator.clipboard.writeText(url);
    toast.info(tCommon("copiedToClipboard"));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-8">
        <div className="flex flex-col items-center">
          <CalendarComponent
            mode="single"
            month={currentMonth}
            selected={date}
            onSelect={handleDaySelect}
            onMonthChange={setCurrentMonth}
            locale={getDateFnsLocaleForUi(uiLocale)}
            dateLocale={dateLocale}
            className="mx-auto"
            classNames={{
              caption_label: "text-md",
            }}
            components={{
              DayButton: CustomDayButton,
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyCalendarExportURL}
            className="mt-2 w-full gap-2"
          >
            <CalendarArrowDown className="size-4" />
            {t("exportCalendar")}
          </Button>
        </div>

        {date && (
          <div className="grow">
            <h2 className="mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold text-xl">
              {new Intl.DateTimeFormat(uiLocale, { dateStyle: "long" }).format(
                date,
              )}

              <CreateEventButton defaultDate={date} />
            </h2>

            <Events
              isLoading={events === undefined}
              currentEvents={currentEvents}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function isCurrentDayEvent(event: CalendarEvent, date?: Date) {
  if (!date || !event.startAt || !event.endAt) {
    return false;
  }

  let endAt = event.endAt;
  if (event.allDay) {
    endAt = new Date(endAt.getTime() - 86400000);
  }

  const eventStart = new Date(
    event.startAt.getFullYear(),
    event.startAt.getMonth(),
    event.startAt.getDate(),
  );
  const eventEnd = new Date(
    endAt.getFullYear(),
    endAt.getMonth(),
    endAt.getDate(),
    23,
    59,
    59,
    999,
  );

  return eventStart <= date && eventEnd >= date;
}
