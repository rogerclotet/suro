"use client";

import { Calendar, ChevronRight, ListTodo, Loader2, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import type { Pot } from "@/app/_data/pot";
import { useProjects } from "@/app/_state/project-state";
import UserAvatar from "@/components/user-avatar";
import { Link } from "@/i18n/navigation";
import { isEventOnDay } from "@/lib/event-day";
import { useEventsInRange } from "@/lib/queries/use-events";
import { useProjectPotsOverview } from "@/lib/queries/use-expenses";
import { useProjectLists } from "@/lib/queries/use-project-lists";
import { cn } from "@/lib/utils";
import ProgressRing from "../../lists/_components/progress-ring";

// How far ahead "Upcoming" looks, and how many items each widget previews
// before deferring to its section's "See all". Mirrors the mobile Home tab.
const UPCOMING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const PREVIEW_LIMIT = 3;
const AVATAR_STACK = 3;

type WidgetHref = Parameters<typeof Link>[0]["href"];

/**
 * A labelled dashboard block. With `seeAllHref` the header taps through to the
 * full section; without it (e.g. Today) the label is just a heading.
 */
function Widget({
  label,
  seeAllHref,
  seeAllLabel,
  children,
}: {
  label: string;
  seeAllHref?: WidgetHref;
  seeAllLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <h2 className="flex-1 font-bold text-muted-foreground text-xs uppercase tracking-wider">
          {label}
        </h2>
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
      {children}
    </section>
  );
}

function WidgetLoading() {
  return (
    <div className="flex justify-center py-6 text-muted-foreground">
      <Loader2 className="animate-spin" size={20} />
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="px-1 py-2 text-[13px] text-muted-foreground">{text}</p>;
}

const rowClassName =
  "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent";

function EventRow({
  event,
  when,
  linkedList,
  linkedListA11y,
}: {
  event: CalendarEvent;
  // Preformatted by the caller: the full dated range for "Upcoming", time-only
  // for "Today" (whose date is implied), so the date is never repeated.
  when: string;
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
      className={rowClassName}
      aria-label={
        linkedList && linkedListA11y ? linkedListA11y(done, total) : undefined
      }
    >
      <Calendar
        size={18}
        className="ml-0.5 shrink-0 text-muted-foreground"
        aria-hidden
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

function ListRow({ list }: { list: List }) {
  const total = list.items.length;
  const done = list.items.filter((item) => item.completed).length;
  const pending = total - done;
  const complete = total > 0 && pending === 0;
  // A complete favourite is on Home because it's pinned, not because it's in
  // progress — drop the progress ring and let the star say why it's here.
  const showProgress = !(list.favorite && complete);

  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/lists/[listId]",
        params: { projectId: list.projectId, listId: list.id },
      }}
      className={rowClassName}
    >
      <ListTodo
        size={18}
        className="shrink-0 text-muted-foreground"
        aria-hidden
      />
      {list.favorite && (
        <Star size={14} className="shrink-0 fill-yellow-400 text-yellow-400" />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-semibold",
          complete && "text-muted-foreground",
        )}
      >
        {list.name}
      </span>
      {showProgress && (
        <ProgressRing done={done} pending={pending} total={total} />
      )}
    </Link>
  );
}

function PotRow({ pot }: { pot: Pot }) {
  const extra = pot.users.length - AVATAR_STACK;

  return (
    <Link
      href={{
        pathname: "/groups/[projectId]/expenses/[potId]",
        params: { projectId: pot.projectId, potId: pot.id },
      }}
      className={rowClassName}
    >
      <span className="min-w-0 flex-1 truncate font-semibold">{pot.name}</span>
      <div className="flex items-center">
        {pot.users.slice(0, AVATAR_STACK).map((member, index) => (
          <UserAvatar
            key={member.user.id || index}
            user={member.user}
            className={cn("h-7 w-7 ring-2 ring-card", index > 0 && "-ml-2")}
          />
        ))}
        {extra > 0 && (
          <span className="ml-1.5 text-[13px] text-muted-foreground">
            {`+${extra}`}
          </span>
        )}
      </div>
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

/** Full dated range (Upcoming), matching the calendar's TimeRange display. */
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

/** Time-only label (Today), since the "Today" header already implies the date. */
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
  const tNav = useTranslations("nav");
  const tCalendar = useTranslations("calendar");
  const { project } = useProjects();

  // Anchor "today" and the look-ahead window once on mount so the events query
  // key stays stable. Query from the start of today so this morning's events —
  // and still-running ones — land in the Today section.
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
  // Today: anything on today's date, including events already running. Upcoming:
  // events that start on a later day, so the two sections never overlap.
  const todayEvents = useMemo(
    () =>
      events
        ?.filter((event) => isEventOnDay(event, bounds.today))
        .slice(0, PREVIEW_LIMIT),
    [events, bounds.today],
  );
  const upcoming = useMemo(
    () =>
      events
        ?.filter((event) => event.startAt.getTime() > bounds.endOfToday)
        .slice(0, PREVIEW_LIMIT),
    [events, bounds.endOfToday],
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
  const activeLists = useMemo(() => {
    if (lists === undefined) {
      return undefined;
    }
    // Lists with at least one pending item (or none yet), favourites first —
    // mirroring the Lists overview's active sectioning and ordering. Event-linked
    // lists surface on their event card instead.
    return lists
      .filter((list) => !list.eventId)
      .filter(
        (list) =>
          list.items.length === 0 || list.items.some((item) => !item.completed),
      )
      .sort(
        (a, b) =>
          Number(b.favorite) - Number(a.favorite) || compareByRecency(a, b),
      )
      .slice(0, PREVIEW_LIMIT);
  }, [lists]);

  const potsOverview = useProjectPotsOverview(projectId, 0);
  const activePots = potsOverview?.active.slice(0, PREVIEW_LIMIT);
  // Expenses are a split-between-people feature, so the section is only relevant
  // once the group has more than one member (mirrors the Expenses tab's solo
  // explainer). Hidden while the project is still loading.
  const isSharedGroup = project !== null && project.users.length > 1;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-2">
      {/* Only when there's something on today — an empty "Today" reads as
          broken, unlike "Upcoming" which always anchors the events area. */}
      {todayEvents && todayEvents.length > 0 && (
        <Widget label={t("today")}>
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                when={formatEventTime(event, locale, tCalendar("allDay"))}
                linkedList={listsByEventId.get(event.id)}
                linkedListA11y={(done, total) =>
                  t("linkedListA11y", { done, total })
                }
              />
            ))}
          </div>
        </Widget>
      )}

      <Widget
        label={t("upcoming")}
        seeAllHref={{
          pathname: "/groups/[projectId]/calendar",
          params: { projectId },
        }}
        seeAllLabel={t("goToCalendar")}
      >
        {upcoming === undefined ? (
          <WidgetLoading />
        ) : upcoming.length === 0 ? (
          <EmptyLine text={t("noUpcoming")} />
        ) : (
          <div className="space-y-3">
            {upcoming.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                when={formatEventRange(event, locale)}
                linkedList={listsByEventId.get(event.id)}
                linkedListA11y={(done, total) =>
                  t("linkedListA11y", { done, total })
                }
              />
            ))}
          </div>
        )}
      </Widget>

      <Widget
        label={tNav("lists")}
        seeAllHref={{
          pathname: "/groups/[projectId]/lists",
          params: { projectId },
        }}
        seeAllLabel={t("showAllLists")}
      >
        {activeLists === undefined ? (
          <WidgetLoading />
        ) : activeLists.length === 0 ? (
          <EmptyLine text={t("noActiveLists")} />
        ) : (
          <div className="space-y-3">
            {activeLists.map((list) => (
              <ListRow key={list.id} list={list} />
            ))}
          </div>
        )}
      </Widget>

      {isSharedGroup && (
        <Widget
          label={tNav("expenses")}
          seeAllHref={{
            pathname: "/groups/[projectId]/expenses",
            params: { projectId },
          }}
          seeAllLabel={t("goToPots")}
        >
          {activePots === undefined ? (
            <WidgetLoading />
          ) : activePots.length === 0 ? (
            <EmptyLine text={t("noActivePots")} />
          ) : (
            <div className="space-y-3">
              {activePots.map((pot) => (
                <PotRow key={pot.id} pot={pot} />
              ))}
            </div>
          )}
        </Widget>
      )}
    </div>
  );
}

function compareByRecency(a: List, b: List) {
  const recency = (list: List) =>
    Math.max(
      list.updatedAt?.getTime() ?? list.createdAt?.getTime() ?? 0,
      ...list.items.map((item) => item.updatedAt?.getTime() ?? 0),
    );
  return recency(b) - recency(a) || a.name.localeCompare(b.name);
}
