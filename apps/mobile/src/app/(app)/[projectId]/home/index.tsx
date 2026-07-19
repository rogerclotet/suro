import { api } from "backend/convex/_generated/api";
import type { Doc } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { type Href, Stack, useRouter } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Flag,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { sectionHeaderBadges } from "@/components/header-badges";
import { priorityColor, useFormatDue } from "@/components/task-fields";
import { useLocale, useTranslations } from "@/i18n";
import {
  useFormatEventRange,
  useFormatEventTime,
  useLongDate,
} from "@/lib/datetime";
import { endOfDay, isEventOnDay, startOfDay } from "@/lib/event-dates";
import { useOfflineListsOverview, usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Loading, ProgressBar, Screen, Txt } from "@/ui";

type ActiveList = NonNullable<
  ReturnType<typeof useOfflineListsOverview>
>["active"][number];
type CalEvent = FunctionReturnType<typeof api.events.listByRange>[number];
type Task = Doc<"listItems"> & { listName: string };
type TaskBucket = "overdue" | "today" | "upcoming" | "noDate";

const UPCOMING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const PREVIEW_LIMIT = 5;

function Panel({
  icon: Icon,
  title,
  seeAllHref,
  seeAllLabel,
  children,
}: {
  icon: LucideIcon;
  title: string;
  seeAllHref?: Href;
  seeAllLabel?: string;
  children: ReactNode;
}) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon color={t.primary} size={15} />
        <Txt weight="700" size={14} style={{ flex: 1 }}>
          {title}
        </Txt>
        {seeAllHref ? (
          <Pressable
            onPress={() => router.navigate(seeAllHref)}
            accessibilityRole="button"
            accessibilityLabel={seeAllLabel}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Txt size={13} style={{ color: t.primary }}>
              {seeAllLabel}
            </Txt>
            <ChevronRight color={t.primary} size={16} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ gap: 0 }}>{children}</View>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Txt muted size={13} style={{ textAlign: "center", paddingVertical: 32 }}>
      {text}
    </Txt>
  );
}

function RowDivider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.border }} />;
}

function InlineStat({
  icon: Icon,
  count,
  label,
}: {
  icon: LucideIcon;
  count: number;
  label: string;
}) {
  const t = useTheme();
  return (
    <View
      accessibilityLabel={`${count} ${label}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      <Icon color={t.primary} size={14} />
      <Txt weight="700" size={14}>
        {count}
      </Txt>
    </View>
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
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
      }}
    >
      <Txt
        weight="700"
        size={20}
        numberOfLines={1}
        style={{ flex: 1, flexShrink: 1 }}
      >
        {dateLabel}
      </Txt>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <InlineStat
          icon={CalendarDays}
          count={eventCount}
          label={eventsLabel}
        />
        <Txt muted size={14}>
          ·
        </Txt>
        <InlineStat icon={CheckSquare} count={taskCount} label={tasksLabel} />
      </View>
    </View>
  );
}

function EventDateBadge({
  date,
  isToday,
  todayLabel,
}: {
  date: Date;
  isToday: boolean;
  todayLabel: string;
}) {
  const t = useTheme();
  const locale = useLocale();
  if (isToday) {
    return (
      <View
        style={{
          minWidth: 44,
          borderRadius: 8,
          backgroundColor: t.primary,
          paddingHorizontal: 8,
          paddingVertical: 6,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Txt
          weight="700"
          size={10}
          style={{ color: t.onPrimary, letterSpacing: 0.5 }}
        >
          {todayLabel.toUpperCase()}
        </Txt>
      </View>
    );
  }

  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "short" });

  return (
    <View
      style={{
        minWidth: 44,
        borderRadius: 8,
        backgroundColor: t.muted + "30",
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt weight="700" size={18}>
        {day}
      </Txt>
      <Txt muted size={10} style={{ letterSpacing: 0.5 }}>
        {month.toUpperCase()}
      </Txt>
    </View>
  );
}

function EventCard({
  event,
  when,
  isToday,
  todayLabel,
  linkedList,
  linkedListA11y,
}: {
  event: CalEvent;
  when: string;
  isToday: boolean;
  todayLabel: string;
  linkedList?: ActiveList;
  linkedListA11y?: (done: number, total: number) => string;
}) {
  const router = useRouter();
  const pid = useProjectId();
  const total = linkedList?.items.length ?? 0;
  const done = linkedList?.items.filter((item) => item.completed).length ?? 0;
  const complete = total > 0 && done === total;
  const showProgress = Boolean(linkedList);

  return (
    <Pressable
      onPress={() => router.navigate(`/${pid}/calendar/${event._id}`)}
      accessibilityRole="button"
      accessibilityLabel={
        linkedList && linkedListA11y ? linkedListA11y(done, total) : undefined
      }
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <EventDateBadge
        date={new Date(event.startAt)}
        isToday={isToday}
        todayLabel={todayLabel}
      />
      <View style={{ flex: 1 }}>
        <Txt weight="700" numberOfLines={1}>
          {event.name}
        </Txt>
        <Txt muted size={13} numberOfLines={1}>
          {when}
        </Txt>
      </View>
      {showProgress ? (
        <View style={{ alignItems: "flex-end", gap: 4, minWidth: 48 }}>
          <Txt muted size={13}>{`${done}/${total}`}</Txt>
          <ProgressBar
            value={total === 0 ? 0 : done / total}
            complete={complete}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

function dueDayCode(task: Task): number {
  const d = new Date(task.dueAt ?? 0);
  if (task.dueAllDay) {
    return (
      d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
    );
  }
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function todayCode(now: Date): number {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function bucketFor(task: Task, today: number): TaskBucket {
  if (task.dueAt === undefined) {
    return "noDate";
  }
  const day = dueDayCode(task);
  if (day < today) {
    return "overdue";
  }
  if (day === today) {
    return "today";
  }
  return "upcoming";
}

const BUCKET_LABELS: Record<
  TaskBucket,
  "agendaOverdue" | "agendaToday" | "agendaUpcoming" | "agendaNoDate"
> = {
  overdue: "agendaOverdue",
  today: "agendaToday",
  upcoming: "agendaUpcoming",
  noDate: "agendaNoDate",
};

function TaskCard({
  task,
  bucket,
  showBucketLabel,
  formatDue,
}: {
  task: Task;
  bucket: TaskBucket;
  showBucketLabel: boolean;
  formatDue: (item: { dueAt: number; dueAllDay?: boolean }) => string;
}) {
  const router = useRouter();
  const pid = useProjectId();
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const overdue = bucket === "overdue";
  const priority = task.priority ?? "normal";

  return (
    <View>
      {showBucketLabel ? (
        <Txt
          size={11}
          weight="700"
          style={{
            paddingHorizontal: 0,
            paddingTop: 8,
            paddingBottom: 4,
            letterSpacing: 0.5,
            color: overdue ? t.danger : t.muted,
          }}
        >
          {tl(BUCKET_LABELS[bucket]).toUpperCase()}
        </Txt>
      ) : null}
      <Pressable
        onPress={() =>
          router.navigate({
            pathname: `/${pid}/lists/${task.listId}`,
            params: { name: task.listName },
          })
        }
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingLeft: overdue ? 10 : 0,
          borderLeftWidth: overdue ? 2 : 0,
          borderLeftColor: overdue ? t.danger : undefined,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: overdue ? t.danger : t.muted,
          }}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt weight="700" numberOfLines={1}>
            {task.name}
          </Txt>
          <Txt muted size={12} numberOfLines={1}>
            {task.listName}
          </Txt>
        </View>
        {task.dueAt !== undefined ? (
          <Txt size={12} style={{ color: overdue ? t.danger : t.muted }}>
            {formatDue({ dueAt: task.dueAt, dueAllDay: task.dueAllDay })}
          </Txt>
        ) : null}
        {priority !== "normal" ? (
          <Flag
            color={priorityColor(t, priority)}
            fill={priorityColor(t, priority)}
            size={14}
          />
        ) : null}
      </Pressable>
    </View>
  );
}

export default function HomeDashboard() {
  const pid = useProjectId();
  const tNav = useTranslations("nav");
  const tHome = useTranslations("mobile.home");
  const project = usePersistentQuery(api.projects.get, { projectId: pid });

  const [bounds] = useState(() => {
    const today = new Date();
    const from = startOfDay(today).getTime();
    return {
      today,
      from,
      endOfToday: endOfDay(today).getTime(),
      to: from + UPCOMING_WINDOW_MS,
    };
  });

  const events = usePersistentQuery(api.events.listByRange, {
    projectId: pid,
    from: bounds.from,
    to: bounds.to,
  });
  const upcomingEvents = useMemo(
    () => events?.slice(0, PREVIEW_LIMIT),
    [events],
  );
  const todayEventCount = useMemo(
    () =>
      events?.filter((event) => isEventOnDay(event, bounds.today)).length ?? 0,
    [events, bounds.today],
  );

  const listsOverview = useOfflineListsOverview(pid, 0);
  const listsByEventId = useMemo(() => {
    const map = new Map<string, ActiveList>();
    for (const list of listsOverview?.active ?? []) {
      if (list.eventId) {
        map.set(list.eventId, list);
      }
    }
    return map;
  }, [listsOverview]);

  const rawTasks = usePersistentQuery(api.tasks.myTasks, { projectId: pid });
  const previewTasks = useMemo(() => {
    if (!rawTasks) {
      return undefined;
    }
    const today = todayCode(new Date());
    return rawTasks.slice(0, PREVIEW_LIMIT).map((task) => ({
      task,
      bucket: bucketFor(task, today),
    }));
  }, [rawTasks]);
  const taskCount = rawTasks?.length ?? 0;

  const formatEventTime = useFormatEventTime();
  const formatEventRange = useFormatEventRange();
  const formatDue = useFormatDue();
  const longDate = useLongDate();

  const dateLabel = longDate(bounds.today);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: project?.name ?? tNav("home"),
          ...sectionHeaderBadges("home"),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 28 }}>
        <HeroHeader
          dateLabel={dateLabel}
          eventCount={todayEventCount}
          taskCount={taskCount}
          eventsLabel={tHome("eventsToday")}
          tasksLabel={tHome("tasksAssigned")}
        />

        <Panel
          icon={CheckSquare}
          title={tHome("myTasks")}
          seeAllHref={`/${pid}/lists/tasks`}
          seeAllLabel={tHome("seeAll")}
        >
          {previewTasks === undefined ? (
            <Loading />
          ) : previewTasks.length === 0 ? (
            <EmptyState text={tHome("noTasks")} />
          ) : (
            <>
              {previewTasks.map(({ task, bucket }, index) => {
                const prevBucket = previewTasks[index - 1]?.bucket;
                return (
                  <View key={task._id}>
                    {index > 0 ? <RowDivider /> : null}
                    <TaskCard
                      task={task}
                      bucket={bucket}
                      showBucketLabel={bucket !== prevBucket}
                      formatDue={formatDue}
                    />
                  </View>
                );
              })}
            </>
          )}
        </Panel>

        <Panel
          icon={Calendar}
          title={tHome("upcoming")}
          seeAllHref={`/${pid}/calendar`}
          seeAllLabel={tHome("goToCalendar")}
        >
          {upcomingEvents === undefined ? (
            <Loading />
          ) : upcomingEvents.length === 0 ? (
            <EmptyState text={tHome("noUpcoming")} />
          ) : (
            <>
              {upcomingEvents.map((event, index) => {
                const isToday = isEventOnDay(event, bounds.today);
                return (
                  <View key={event._id}>
                    {index > 0 ? <RowDivider /> : null}
                    <EventCard
                      event={event}
                      isToday={isToday}
                      todayLabel={tHome("today")}
                      when={
                        isToday
                          ? formatEventTime(event)
                          : formatEventRange(event)
                      }
                      linkedList={listsByEventId.get(event._id)}
                      linkedListA11y={(done, total) =>
                        tHome("linkedListA11y", { done, total })
                      }
                    />
                  </View>
                );
              })}
            </>
          )}
        </Panel>
      </ScrollView>
    </Screen>
  );
}
