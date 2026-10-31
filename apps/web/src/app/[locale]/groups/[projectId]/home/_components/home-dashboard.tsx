"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  eventDatesForForm,
  eventLocalStart,
  eventWindowBounds,
  pickUpcomingEvents,
  sameDay,
} from "domain/events";
import {
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ListChecks,
  Loader2,
  Star,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/_data/event";
import {
  adaptListPreview,
  adaptTask,
  type ListPreviewData,
} from "@/app/_data/list";
import { ListPreviewRow } from "@/app/[locale]/groups/[projectId]/lists/_components/list-preview";
import ProgressRing from "@/app/[locale]/groups/[projectId]/lists/_components/progress-ring";
import { TaskRow } from "@/app/[locale]/groups/[projectId]/lists/tasks/_components/task-row";
import { UnreadDot } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { eventTimes, isEventOnDay } from "@/lib/event-day";
import { useEventsInRange } from "@/lib/queries/use-events";
import { useUnreadItemCount } from "@/lib/queries/use-notifications";
import { cn } from "@/lib/utils";
import { HomeSectionChips } from "./home-section-chips";

const UPCOMING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const PREVIEW_LIMIT = 5;
const TASK_PREVIEW_LIMIT = 3;

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
        <h2 className="flex-1 text-sm font-semibold tracking-tight">{title}</h2>
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
  href,
}: {
  icon: typeof CalendarDays;
  count: number;
  label: string;
  href: WidgetHref;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground transition-opacity hover:opacity-70"
      title={label}
      aria-label={`${count} ${label}`}
    >
      <Icon size={14} className="text-primary" aria-hidden />
      <span className="font-semibold text-foreground tabular-nums">
        {count}
      </span>
      <span className="hidden min-[420px]:inline">{label}</span>
    </Link>
  );
}

function HeroHeader({
  projectId,
  dateLabel,
  eventCount,
  taskCount,
  eventsLabel,
  tasksLabel,
}: {
  projectId: string;
  dateLabel: string;
  eventCount: number;
  taskCount: number;
  eventsLabel: string;
  tasksLabel: string;
}) {
  return (
    <header className="flex flex-nowrap items-center gap-3 border-b border-border/60 pb-4">
      <p className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight">
        {dateLabel}
      </p>
      <div className="flex shrink-0 flex-nowrap items-center gap-2.5">
        <InlineStat
          icon={CalendarDays}
          count={eventCount}
          label={eventsLabel}
          href={{
            pathname: "/groups/[projectId]/calendar",
            params: { projectId },
          }}
        />
        <span className="text-border" aria-hidden>
          ·
        </span>
        <InlineStat
          icon={CheckSquare}
          count={taskCount}
          label={tasksLabel}
          href={{
            pathname: "/groups/[projectId]/lists/tasks",
            params: { projectId },
          }}
        />
      </div>
    </header>
  );
}

type Balance = FunctionReturnType<typeof api.expenses.myBalance>;

function formatEuros(cents: number) {
  return `${(cents / 100).toFixed(2)}€`;
}

/**
 * What the user owes and is owed across the group's open shared pots. Hidden
 * when they aren't in any, so solo groups and groups without pots skip it.
 */
function BalanceLine({
  projectId,
  balance,
}: {
  projectId: string;
  balance: Balance | undefined;
}) {
  const t = useTranslations("home");
  if (!balance?.openPots) return null;
  const lines = [
    balance.owe
      ? t("balanceOwe", {
          amount: formatEuros(balance.owe),
          count: balance.owingPots,
        })
      : null,
    balance.owed
      ? t("balanceOwed", {
          amount: formatEuros(balance.owed),
          count: balance.owedPots,
        })
      : null,
  ].filter((line) => line !== null);
  return (
    <Link
      href={{ pathname: "/groups/[projectId]/expenses", params: { projectId } }}
      className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm transition-colors hover:bg-accent"
    >
      <Wallet size={18} className="shrink-0 text-primary" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {lines.length === 0 ? (
          <span>{t("balanceSettled")}</span>
        ) : (
          lines.map((line) => (
            <span key={line} className="font-semibold">
              {line}
            </span>
          ))
        )}
      </span>
      <ChevronRight
        size={18}
        className="shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
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
        <span className="text-[10px] leading-none font-bold tracking-wide uppercase">
          {todayLabel}
        </span>
      </div>
    );
  }

  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "short" });

  return (
    <div className="flex min-w-[2.75rem] flex-col items-center justify-center rounded-lg bg-muted px-2 py-1.5">
      <span className="text-lg leading-none font-bold tabular-nums">{day}</span>
      <span className="text-[10px] leading-none font-semibold tracking-wide text-muted-foreground uppercase">
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
  linkedList?: ListPreviewData;
  linkedListA11y?: (done: number, total: number) => string;
}) {
  const total = linkedList?.total ?? 0;
  const done = linkedList?.done ?? 0;
  const pending = total - done;
  const changes = useUnreadItemCount(event.projectId, event.id);

  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/calendar/[eventId]",
        params: { projectId: event.projectId, eventId: event.id },
      }}
      className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-accent"
      aria-label={
        linkedList && linkedListA11y ? linkedListA11y(done, total) : undefined
      }
    >
      <EventDateBadge
        date={eventLocalStart(eventTimes(event))}
        isToday={isToday}
        todayLabel={todayLabel}
        locale={locale}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold">{event.name}</span>
          <UnreadDot count={changes} />
        </div>
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

function formatEventRange(event: CalendarEvent, locale: string): string {
  const { from: startAt, to: endAt } = eventDatesForForm(eventTimes(event));
  const { allDay } = event;

  if (allDay) {
    const displayEnd = endAt;
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
    const { from, to } = eventDatesForForm(eventTimes(event));
    return sameDay(to, from) ? allDayLabel : formatEventRange(event, locale);
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
  const tLists = useTranslations("lists");

  const [bounds] = useState(() =>
    eventWindowBounds(new Date(), UPCOMING_WINDOW_MS),
  );
  const events = useEventsInRange(projectId, bounds.today, bounds.lastDay);
  const upcomingEvents = useMemo(
    () =>
      events &&
      pickUpcomingEvents(
        events.map((event) => ({ ...eventTimes(event), source: event })),
        bounds.today,
        PREVIEW_LIMIT,
      ).map((event) => event.source),
    [events, bounds.today],
  );
  const todayEventCount = useMemo(
    () =>
      events?.filter((event) => isEventOnDay(event, bounds.today)).length ?? 0,
    [events, bounds.today],
  );

  const { isAuthenticated } = useConvexAuth();
  const listPreviews = useQuery(
    api.lists.homePreviews,
    isAuthenticated && upcomingEvents
      ? {
          projectId: projectId as Id<"projects">,
          eventIds: upcomingEvents.map((event) => event.id as Id<"events">),
        }
      : "skip",
  );
  const listsByEventId = useMemo(() => {
    const map = new Map<string, ListPreviewData>();
    for (const list of listPreviews?.previews ?? []) {
      if (list.eventId) {
        map.set(list.eventId, adaptListPreview(list));
      }
    }
    return map;
  }, [listPreviews]);

  const rawTasks = useQuery(
    api.tasks.myTasks,
    isAuthenticated
      ? {
          projectId: projectId as Id<"projects">,
        }
      : "skip",
  );
  const balance = useQuery(
    api.expenses.myBalance,
    isAuthenticated ? { projectId: projectId as Id<"projects"> } : "skip",
  );
  // Server-sorted by due date, so the first few are the most pressing.
  const previewTasks = rawTasks?.slice(0, TASK_PREVIEW_LIMIT);
  const featuredLists = listPreviews?.previews
    .filter((list) => listPreviews.favoriteIds.includes(list._id))
    .map(adaptListPreview);
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
          projectId={projectId}
          dateLabel={dateLabel}
          eventCount={todayEventCount}
          taskCount={taskCount}
          eventsLabel={t("eventsToday")}
          tasksLabel={t("tasksAssigned")}
        />
        <HomeSectionChips projectId={projectId} />
        <BalanceLine projectId={projectId} balance={balance} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {previewTasks?.length ? (
          <Panel
            icon={ListChecks}
            title={tLists("myTasks")}
            seeAllHref={{
              pathname: "/groups/[projectId]/lists/tasks",
              params: { projectId },
            }}
            seeAllLabel={t("seeAll")}
          >
            {previewTasks.map((task) => (
              <TaskRow
                key={task._id}
                projectId={projectId}
                task={adaptTask(task)}
                className="px-1"
              />
            ))}
          </Panel>
        ) : null}
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
              <ListPreviewRow key={list.id} list={list} />
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
