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
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { adaptTask, type TaskWithList } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Link } from "@/i18n/navigation";
import { isEventOnDay } from "@/lib/event-day";
import { useEventsInRange } from "@/lib/queries/use-events";
import { useProjectLists } from "@/lib/queries/use-project-lists";
import { cn } from "@/lib/utils";
import ProgressRing from "../../lists/_components/progress-ring";
import { DueChip } from "../../lists/[listId]/_components/list-item/due-chip";
import { PriorityBadge } from "../../lists/[listId]/_components/list-item/priority-badge";

const UPCOMING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const PREVIEW_LIMIT = 5;

type WidgetHref = Parameters<typeof Link>[0]["href"];
type TaskBucket = "overdue" | "today" | "upcoming" | "noDate";

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
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <Icon size={16} className="shrink-0 text-primary" aria-hidden />
        <h2 className="flex-1 font-semibold text-sm">{title}</h2>
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
      <div className="flex-1 p-2">{children}</div>
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
    <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
      {text}
    </p>
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
    <header className="rounded-2xl border bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-5 shadow-sm">
      <p className="font-bold text-2xl tracking-tight">{dateLabel}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border bg-card/80 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays size={16} className="text-primary" aria-hidden />
          </div>
          <div>
            <p className="font-bold text-lg leading-none tabular-nums">
              {eventCount}
            </p>
            <p className="text-[11px] text-muted-foreground">{eventsLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border bg-card/80 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <CheckSquare size={16} className="text-primary" aria-hidden />
          </div>
          <div>
            <p className="font-bold text-lg leading-none tabular-nums">
              {taskCount}
            </p>
            <p className="text-[11px] text-muted-foreground">{tasksLabel}</p>
          </div>
        </div>
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
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

function TaskCard({
  task,
  projectId,
  bucket,
  bucketLabel,
  showBucketLabel,
}: {
  task: TaskWithList;
  projectId: string;
  bucket: TaskBucket;
  bucketLabel: string;
  showBucketLabel: boolean;
}) {
  const overdue = bucket === "overdue";

  return (
    <div>
      {showBucketLabel && (
        <p
          className={cn(
            "px-3 pt-2 pb-1 font-semibold text-[11px] uppercase tracking-wider",
            overdue ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {bucketLabel}
        </p>
      )}
      <Link
        href={{
          pathname: "/groups/[projectId]/lists/[listId]",
          params: { projectId, listId: task.listId },
        }}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent",
          overdue && "border-l-2 border-l-destructive",
        )}
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            overdue ? "bg-destructive" : "bg-muted-foreground",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{task.name}</div>
          <div className="truncate text-[12px] text-muted-foreground">
            {task.listName}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {task.dueAt && (
            <DueChip
              dueAt={task.dueAt}
              allDay={task.dueAllDay}
              completed={false}
            />
          )}
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>
      </Link>
    </div>
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

function localDayIndex(date: Date): number {
  return Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() /
      86_400_000,
  );
}

function utcDayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000,
  );
}

function bucketFor(task: TaskWithList, todayIndex: number): TaskBucket {
  if (!task.dueAt) {
    return "noDate";
  }
  const dayIndex = task.dueAllDay
    ? utcDayIndex(task.dueAt)
    : localDayIndex(task.dueAt);
  if (dayIndex < todayIndex) {
    return "overdue";
  }
  if (dayIndex === todayIndex) {
    return "today";
  }
  return "upcoming";
}

export default function HomeDashboard({ projectId }: { projectId: string }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const tLists = useTranslations("lists");
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
  const previewTasks = useMemo(() => {
    if (!rawTasks) {
      return undefined;
    }
    const todayIndex = localDayIndex(bounds.today);
    return rawTasks
      .map(adaptTask)
      .slice(0, PREVIEW_LIMIT)
      .map((task) => ({
        task,
        bucket: bucketFor(task, todayIndex),
      }));
  }, [rawTasks, bounds.today]);
  const taskCount = rawTasks?.length ?? 0;

  const dateLabel = bounds.today.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <HeroHeader
        dateLabel={dateLabel}
        eventCount={todayEventCount}
        taskCount={taskCount}
        eventsLabel={t("eventsToday")}
        tasksLabel={t("tasksAssigned")}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          icon={CheckSquare}
          title={t("myTasks")}
          seeAllHref={{
            pathname: "/groups/[projectId]/lists/tasks",
            params: { projectId },
          }}
          seeAllLabel={t("seeAll")}
        >
          {previewTasks === undefined ? (
            <PanelLoading />
          ) : previewTasks.length === 0 ? (
            <EmptyState text={t("noTasks")} />
          ) : (
            <div className="divide-y divide-border/60">
              {previewTasks.map(({ task, bucket }, index) => {
                const prevBucket = previewTasks[index - 1]?.bucket;
                const showBucketLabel = bucket !== prevBucket;
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectId={projectId}
                    bucket={bucket}
                    bucketLabel={tLists(`taskBucket_${bucket}`)}
                    showBucketLabel={showBucketLabel}
                  />
                );
              })}
            </div>
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
            <div className="divide-y divide-border/60">
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
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
