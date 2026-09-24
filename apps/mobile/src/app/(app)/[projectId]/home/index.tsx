import { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { type Href, Stack, useRouter } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Settings,
  Star,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { sectionHeaderBadges } from "@/components/header-badges";
import { HomeSectionChips } from "@/components/home-section-chips";
import { useLocale, useTranslations } from "@/i18n";
import {
  useFormatEventRange,
  useFormatEventTime,
  useLongDate,
} from "@/lib/datetime";
import {
  eventLocalStart,
  isEventOnDay,
  pickUpcomingEvents,
} from "@/lib/event-dates";
import { unreadCount } from "@/lib/notification-routing";
import {
  useOpenNotificationSection,
  useUnreadNotifications,
} from "@/lib/notifications";
import { useOfflineListsOverview, usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTodayAnchor } from "@/lib/use-today-anchor";
import { useTheme } from "@/theme";
import { Loading, ProgressBar, Screen, Txt } from "@/ui";

type ActiveList = NonNullable<
  ReturnType<typeof useOfflineListsOverview>
>["active"][number];
type CalEvent = FunctionReturnType<typeof api.events.listByRange>[number];

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
        date={eventLocalStart(event)}
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

function FeaturedListCard({ list }: { list: ActiveList }) {
  const router = useRouter();
  const total = list.items.length;
  const done = list.items.filter((item) => item.completed).length;
  const complete = total > 0 && done === total;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: `/${list.projectId}/lists/${list._id}`,
          params: { name: list.name },
        })
      }
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt weight="700" muted={complete} numberOfLines={1}>
          {list.name}
        </Txt>
        {list.description ? (
          <Txt muted size={13} numberOfLines={1}>
            {list.description}
          </Txt>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 4, minWidth: 48 }}>
        <Txt muted size={13}>{`${done}/${total}`}</Txt>
        <ProgressBar
          value={total === 0 ? 0 : done / total}
          complete={complete}
        />
      </View>
    </Pressable>
  );
}

export default function HomeDashboard() {
  const pid = useProjectId();
  const unread = useUnreadNotifications();
  const openSection = useOpenNotificationSection(pid);
  const group = usePersistentQuery(api.projects.get, { projectId: pid });
  const tNav = useTranslations("nav");
  const tHome = useTranslations("mobile.home");
  const tGroups = useTranslations("mobile.groups");

  const bounds = useTodayAnchor(UPCOMING_WINDOW_MS);

  const events = usePersistentQuery(api.events.listByRange, {
    projectId: pid,
    from: bounds.from,
    to: bounds.to,
  });
  const upcomingEvents = useMemo(
    () => pickUpcomingEvents(events ?? [], bounds.today, PREVIEW_LIMIT),
    [events, bounds.today],
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
  const featuredLists = listsOverview?.active
    .filter((list) => list.favorite)
    .slice(0, PREVIEW_LIMIT);
  const taskCount = rawTasks?.length ?? 0;

  const formatEventTime = useFormatEventTime();
  const formatEventRange = useFormatEventRange();
  const longDate = useLongDate();

  const dateLabel = longDate(bounds.today);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: group?.name ?? tNav("home"),
          ...sectionHeaderBadges("home", undefined, [
            {
              icon: Settings,
              label: tGroups("manageGroup"),
              count: unreadCount(unread, pid, "members"),
              onPress: () =>
                openSection("members", `/group-settings?projectId=${pid}`),
            },
          ]),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 28 }}>
        <View style={{ gap: 12 }}>
          <HeroHeader
            dateLabel={dateLabel}
            eventCount={todayEventCount}
            taskCount={taskCount}
            eventsLabel={tHome("eventsToday")}
            tasksLabel={tHome("tasksAssigned")}
          />
          <HomeSectionChips />
        </View>

        <Panel
          icon={Star}
          title={tHome("featuredLists")}
          seeAllHref={`/${pid}/lists`}
          seeAllLabel={tHome("seeAll")}
        >
          {featuredLists === undefined ? (
            <Loading />
          ) : featuredLists.length === 0 ? (
            <EmptyState text={tHome("noFeaturedLists")} />
          ) : (
            featuredLists.map((list, index) => (
              <View key={list._id}>
                {index > 0 ? <RowDivider /> : null}
                <FeaturedListCard list={list} />
              </View>
            ))
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
