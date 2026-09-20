"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Loader2,
  Star,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import ListPreview from "@/app/[locale]/groups/[projectId]/lists/_components/list-preview";
import ProgressRing from "@/app/[locale]/groups/[projectId]/lists/_components/progress-ring";
import { Link } from "@/i18n/navigation";
import { isEventOnDay } from "@/lib/event-day";
import { useEventsInRange } from "@/lib/queries/use-events";
import { useProjectLists } from "@/lib/queries/use-project-lists";
import { cn } from "@/lib/utils";
import { HomeSectionChips } from "./home-section-chips";

const UPCOMING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const PREVIEW_LIMIT = 5;

type WidgetHref = Parameters<typeof Link>[0]["href"];

function Panel({
  icon: Icon,
  title,
  seeAllHref,
  seeAllLabel,
  children,
  className,
}: {
  icon: typeof Calendar;
  title: string;
  seeAllHref?: WidgetHref;
  seeAllLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={15} className="shrink-0 text-primary" aria-hidden />
        <h2 className="flex-1 font-semibold text-sm tracking-tight">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-0.5 text-[13px] text-primary transition-opacity hover:opacity-70"
          >
            {seeAllLabel}
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <div className="flex-1 divide-y divide-border/60">{children}</div>
    </section>
  );
}

function PanelLoading() {
  return (
    <div className="flex justify-center py-10 text-muted-foreground">
      <Loader2 className="animate-spin" size={20} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="px-3 py-8 text-center font-display text-[13px] text-muted-foreground">
      {text}
    </p>
  );
}

function InlineStat({
  icon: Icon,
  count,
  label,
}: {
  icon: typeof CalendarDays;
  count: number;
  label: string;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground"
      title={label}
    >
      <Icon size={14} className="text-primary" aria-hidden />
      <span className="font-semibold tabular-nums text-foreground">
        {count}
      </span>
      <span className="hidden min-[420px]:inline">{label}</span>
    </span>
  );
}

function HeroHeader({
  dateLabel,
  eventCount,
  taskCount,
  eventsLabel,
  tasksLabel,
}: {
  dateLabel: string;
  eventCount: number;
  taskCount: number;
  eventsLabel: string;
  tasksLabel: string;
}) {
  return (
    <header className="flex flex-nowrap items-center gap-3 border-b border-border/60 pb-4">
      <p className="min-w-0 flex-1 truncate font-bold text-xl tracking-tight">
        {dateLabel}
      </p>
      <div className="flex shrink-0 flex-nowrap items-center gap-2.5">
        <InlineStat
          icon={CalendarDays}
          count={eventCount}
          label={eventsLabel}
        />
        <span className="text-border" aria-hidden>
          ·
        </span>
        <InlineStat icon={CheckSquare} count={taskCount} label={tasksLabel} />
      </div>
    </header>
  );
}

function EventDateBadge({
  date,
  isToday,
  todayLabel,
  locale,
}: {
  date: Date;
  isToday: boolean;
  todayLabel: string;
  locale: string;
}) {
  if (isToday) {
    return (
      <div className="flex min-w-[2.75rem] flex-col items-center justify-center rounded-lg bg-primary px-2 py-1.5 text-primary-foreground">
        <span className="font-bold text-[10px] uppercase leading-none tracking-wide">
          {todayLabel}
        </span>
      </div>
    );
  }

  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "short" });

  return (
    <div className="flex min-w-[2.75rem] flex-col items-center justify-center rounded-lg bg-muted px-2 py-1.5">
      <span className="font-bold text-lg leading-none tabular-nums">{day}</span>
      <span className="font-semibold text-[10px] uppercase leading-none tracking-wide text-muted-foreground">
        {month}
      </span>
    </div>
  );
}

function EventCard({
  event,
  when,
  isToday,
  todayLabel,
  locale,
  linkedList,
  linkedListA11y,
}: {
  event: CalendarEvent;
  when: string;
  isToday: boolean;
  todayLabel: string;
  locale: string;
  linkedList?: List;
  linkedListA11y?: (done: number, total: number) => string;
}) {
  const total = linkedList?.items.length ?? 0;
  const done = linkedList?.items.filter((item) => item.completed).length ?? 0;
  const pending = total - done;

  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/calendar/[eventId]",
        params: { projectId: event.projectId, eventId: event.id },
      }}
      className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-accent/50"
      aria-label={
        linkedList && linkedListA11y ? linkedListA11y(done, total) : undefined
      }
    >
      <EventDateBadge
        date={event.startAt}
        isToday={isToday}
        todayLabel={todayLabel}
        locale={locale}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{event.name}</div>
        <div className="truncate text-[13px] text-muted-foreground">{when}</div>
      </div>
      {linkedList ? (
        <ProgressRing done={done} pending={pending} total={total} />
      ) : null}
    </Link>
  );
}

const DATE_OPTS: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
const TIME_OPTS: Intl.DateTimeFormatOptions = { timeStyle: "short" };

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatEventRange(event: CalendarEvent, locale: string): string {
  const { startAt, endAt, allDay } = event;

  if (allDay) {
    const displayEnd = new Date(
      endAt.getFullYear(),
      endAt.getMonth(),
      endAt.getDate() - 1,
    );
    if (sameDay(displayEnd, startAt)) {
      return startAt.toLocaleDateString(locale, DATE_OPTS);
    }
    return `${startAt.toLocaleDateString(locale, DATE_OPTS)} - ${displayEnd.toLocaleDateString(locale, DATE_OPTS)}`;
  }

  if (sameDay(startAt, endAt)) {
    return `${startAt.toLocaleString(locale, { ...DATE_OPTS, ...TIME_OPTS })} - ${endAt.toLocaleTimeString(locale, TIME_OPTS)}`;
  }
  return `${startAt.toLocaleString(locale, { ...DATE_OPTS, ...TIME_OPTS })} - ${endAt.toLocaleString(locale, { ...DATE_OPTS, ...TIME_OPTS })}`;
}

function formatEventTime(
  event: CalendarEvent,
  locale: string,
  allDayLabel: string,
): string {
  if (event.allDay) {
    const displayEnd = new Date(
      event.endAt.getFullYear(),
      event.endAt.getMonth(),
      event.endAt.getDate() - 1,
    );
    return sameDay(displayEnd, event.startAt)
      ? allDayLabel
      : formatEventRange(event, locale);
  }
  if (sameDay(event.startAt, event.endAt)) {
    return `${event.startAt.toLocaleTimeString(locale, TIME_OPTS)} - ${event.endAt.toLocaleTimeString(locale, TIME_OPTS)}`;
  }
  return formatEventRange(event, locale);
}

export default function HomeDashboard({ projectId }: { projectId: string }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const tCalendar = useTranslations("calendar");

  const [bounds] = useState(() => {
    const today = new Date();
    const from = new Date(today);
    from.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    return {
      today,
      from,
      endOfToday: endOfToday.getTime(),
      to: new Date(from.getTime() + UPCOMING_WINDOW_MS),
    };
  });

  const events = useEventsInRange(projectId, bounds.from, bounds.to);
  const upcomingEvents = useMemo(
    () =>
      events
        ?.filter((event) => event.endAt.getTime() >= bounds.from.getTime())
        .slice(0, PREVIEW_LIMIT),
    [events, bounds.from],
  );
  const todayEventCount = useMemo(
    () =>
      events?.filter((event) => isEventOnDay(event, bounds.today)).length ?? 0,
    [events, bounds.today],
  );

  const lists = useProjectLists(projectId);
  const listsByEventId = useMemo(() => {
    const map = new Map<string, List>();
    for (const list of lists ?? []) {
      if (list.eventId) {
        map.set(list.eventId, list);
      }
    }
    return map;
  }, [lists]);

  const rawTasks = useQuery(api.tasks.myTasks, {
    projectId: projectId as Id<"projects">,
  });
  const featuredLists = lists
    ?.filter((list) => list.favorite)
    .slice(0, PREVIEW_LIMIT);
  const taskCount = rawTasks?.length ?? 0;

  const dateLabel = bounds.today.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-2">
      <div className="space-y-3">
        <HeroHeader
          dateLabel={dateLabel}
          eventCount={todayEventCount}
          taskCount={taskCount}
          eventsLabel={t("eventsToday")}
          tasksLabel={t("tasksAssigned")}
        />
        <HomeSectionChips projectId={projectId} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel
          icon={Star}
          title={t("featuredLists")}
          seeAllHref={{
            pathname: "/groups/[projectId]/lists",
            params: { projectId },
          }}
          seeAllLabel={t("seeAll")}
        >
          {featuredLists === undefined ? (
            <PanelLoading />
          ) : featuredLists.length === 0 ? (
            <EmptyState text={t("noFeaturedLists")} />
          ) : (
            featuredLists.map((list) => (
              <ListPreview key={list.id} list={list} />
            ))
          )}
        </Panel>

        <Panel
          icon={Calendar}
          title={t("upcoming")}
          seeAllHref={{
            pathname: "/groups/[projectId]/calendar",
            params: { projectId },
          }}
          seeAllLabel={t("goToCalendar")}
        >
          {upcomingEvents === undefined ? (
            <PanelLoading />
          ) : upcomingEvents.length === 0 ? (
            <EmptyState text={t("noUpcoming")} />
          ) : (
            <>
              {upcomingEvents.map((event) => {
                const isToday = isEventOnDay(event, bounds.today);
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    isToday={isToday}
                    todayLabel={t("today")}
                    locale={locale}
                    when={
                      isToday
                        ? formatEventTime(event, locale, tCalendar("allDay"))
                        : formatEventRange(event, locale)
                    }
                    linkedList={listsByEventId.get(event.id)}
                    linkedListA11y={(done, total) =>
                      t("linkedListA11y", { done, total })
                    }
                  />
                );
              })}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
