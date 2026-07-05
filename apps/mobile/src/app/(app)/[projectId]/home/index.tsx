import { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { type Href, Stack, useRouter } from "expo-router";
import { Calendar, ChevronRight, ListTodo, Star } from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { sectionHeaderBadges } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useFormatEventRange, useFormatEventTime } from "@/lib/datetime";
import { endOfDay, isEventOnDay, startOfDay } from "@/lib/event-dates";
import {
  useOfflineListPotsOverview,
  useOfflineListsOverview,
  usePersistentQuery,
} from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useStable } from "@/lib/use-stable";
import { useTheme } from "@/theme";
import { Card, Loading, ProgressBar, Screen, Txt } from "@/ui";

type ActiveList = NonNullable<
  ReturnType<typeof useOfflineListsOverview>
>["active"][number];
type ActivePot = NonNullable<
  ReturnType<typeof useOfflineListPotsOverview>
>["active"][number];
type CalEvent = FunctionReturnType<typeof api.events.listByRange>[number];

// How far ahead the "Upcoming" widget looks, and how many items each widget
// previews before deferring to its section's "See all".
const UPCOMING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const PREVIEW_LIMIT = 3;
const AVATAR_STACK = 3;

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
  seeAllHref?: Href;
  seeAllLabel?: string;
  children: ReactNode;
}) {
  const t = useTheme();
  const router = useRouter();
  const heading = (
    <Txt weight="700" size={13} style={{ flex: 1, letterSpacing: 0.5 }}>
      {label.toUpperCase()}
    </Txt>
  );
  return (
    <View style={{ gap: 8 }}>
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
          {heading}
          <Txt size={13} style={{ color: t.primary }}>
            {seeAllLabel}
          </Txt>
          <ChevronRight color={t.primary} size={16} />
        </Pressable>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {heading}
        </View>
      )}
      {children}
    </View>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <Txt muted size={13} style={{ paddingVertical: 8 }}>
      {text}
    </Txt>
  );
}

function EventRow({
  event,
  when,
  linkedList,
  linkedListA11y,
}: {
  event: CalEvent;
  // Preformatted by the caller: the full date+time for "Upcoming", time-only
  // for "Today" (whose date is implied), so the date is never repeated.
  when: string;
  linkedList?: ActiveList;
  linkedListA11y?: (done: number, total: number) => string;
}) {
  const router = useRouter();
  const pid = useProjectId();
  const t = useTheme();
  const total = linkedList?.items.length ?? 0;
  const done = linkedList?.items.filter((item) => item.completed).length ?? 0;
  const complete = total > 0 && done === total;
  const showProgress = Boolean(linkedList);

  return (
    <Card
      onPress={() => router.navigate(`/${pid}/calendar/${event._id}`)}
      accessibilityLabel={
        linkedList && linkedListA11y ? linkedListA11y(done, total) : undefined
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Calendar color={t.muted} size={18} />
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
      </View>
    </Card>
  );
}

function ListRow({ list }: { list: ActiveList }) {
  const router = useRouter();
  const pid = useProjectId();
  const t = useTheme();
  const total = list.items.length;
  const done = list.items.filter((item) => item.completed).length;
  const complete = total > 0 && done === total;
  // A complete favourite is on Home because it's pinned, not because it's in
  // progress — drop the progress UI and let the star say why it's here. (Only
  // favourites surface once complete, so the count/bar still show otherwise.)
  const showProgress = !(list.favorite && complete);
  return (
    <Card onPress={() => router.navigate(`/${pid}/lists/${list._id}`)}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ListTodo color={t.muted} size={18} />
        {list.favorite ? (
          <Star size={14} color={t.marker} fill={t.marker} />
        ) : null}
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Txt weight="700" style={{ flex: 1 }} numberOfLines={1}>
              {list.name}
            </Txt>
            {showProgress ? (
              <Txt muted size={13}>{`${done}/${total}`}</Txt>
            ) : null}
          </View>
          {showProgress ? (
            <ProgressBar
              value={total === 0 ? 0 : done / total}
              complete={complete}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function PotRow({ pot }: { pot: ActivePot }) {
  const router = useRouter();
  const pid = useProjectId();
  const extra = pot.members.length - AVATAR_STACK;
  return (
    <Card onPress={() => router.navigate(`/${pid}/expenses/${pot._id}`)}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Txt weight="700" style={{ flex: 1 }} numberOfLines={1}>
          {pot.name}
        </Txt>
        <View style={{ flexDirection: "row" }}>
          {pot.members.slice(0, AVATAR_STACK).map((member, index) => (
            <View
              key={member._id ?? index}
              style={{ marginLeft: index === 0 ? 0 : -8 }}
            >
              <Avatar
                name={member.name}
                image={member.image}
                color={member.avatarColor}
                size={26}
              />
            </View>
          ))}
          {extra > 0 ? (
            <Txt muted size={13} style={{ marginLeft: 6, alignSelf: "center" }}>
              {`+${extra}`}
            </Txt>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export default function HomeDashboard() {
  const pid = useProjectId();
  const tNav = useTranslations("nav");
  const tHome = useTranslations("mobile.home");
  // Title Home with the group's name so it gives context to the group badge;
  // fall back to the generic label until the (offline-cached) name resolves.
  const project = usePersistentQuery(api.projects.get, { projectId: pid });

  // Anchor "today" and the look-ahead window at mount (lazy initializer) so the
  // events query key stays stable. Query from the start of today so this
  // morning's events — and still-running ones — land in the Today section.
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
        ?.filter((event) => event.startAt > bounds.endOfToday)
        .slice(0, PREVIEW_LIMIT),
    [events, bounds.endOfToday],
  );

  const listsOverview = useStable(useOfflineListsOverview(pid, 0));
  const listsByEventId = useMemo(() => {
    const map = new Map<string, ActiveList>();
    for (const list of listsOverview?.active ?? []) {
      if (list.eventId) {
        map.set(list.eventId, list);
      }
    }
    return map;
  }, [listsOverview]);
  const activeLists = useMemo(() => {
    if (!listsOverview) {
      return undefined;
    }
    // Favourites first, mirroring the Lists tab's ordering. Event-linked lists
    // surface on their event card instead.
    return [...listsOverview.active]
      .filter((list) => !list.eventId)
      .sort((a, b) => Number(b.favorite) - Number(a.favorite))
      .slice(0, PREVIEW_LIMIT);
  }, [listsOverview]);

  const potsOverview = useStable(useOfflineListPotsOverview(pid, 0));
  const activePots = potsOverview?.active.slice(0, PREVIEW_LIMIT);
  // Expenses are a split-between-people feature, so the section is only relevant
  // once the group has more than one member (mirrors the Expenses tab's solo
  // explainer). Hidden while the membership is still loading.
  const members = usePersistentQuery(api.projects.members, { projectId: pid });
  const isSharedGroup = members !== undefined && members.length > 1;

  // "Today" implies the date, so show clock times only; "Upcoming" spans future
  // days, so it keeps the full dated range.
  const formatEventTime = useFormatEventTime();
  const formatEventRange = useFormatEventRange();

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: project?.name ?? tNav("home"),
          // Group badge + switcher, no create action. Section "home" routes a
          // group switch back to this tab.
          ...sectionHeaderBadges("home"),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Only when there's something on today — an empty "Today" reads as
            broken, unlike "Upcoming" which always anchors the events area. */}
        {todayEvents && todayEvents.length > 0 ? (
          <Widget label={tHome("today")}>
            <View style={{ gap: 12 }}>
              {todayEvents.map((event) => (
                <EventRow
                  key={event._id}
                  event={event}
                  when={formatEventTime(event)}
                  linkedList={listsByEventId.get(event._id)}
                  linkedListA11y={(done, total) =>
                    tHome("linkedListA11y", { done, total })
                  }
                />
              ))}
            </View>
          </Widget>
        ) : null}

        <Widget
          label={tHome("upcoming")}
          seeAllHref={`/${pid}/calendar`}
          seeAllLabel={tHome("goToCalendar")}
        >
          {upcoming === undefined ? (
            <Loading />
          ) : upcoming.length === 0 ? (
            <EmptyLine text={tHome("noUpcoming")} />
          ) : (
            <View style={{ gap: 12 }}>
              {upcoming.map((event) => (
                <EventRow
                  key={event._id}
                  event={event}
                  when={formatEventRange(event)}
                  linkedList={listsByEventId.get(event._id)}
                  linkedListA11y={(done, total) =>
                    tHome("linkedListA11y", { done, total })
                  }
                />
              ))}
            </View>
          )}
        </Widget>

        <Widget
          label={tNav("lists")}
          seeAllHref={`/${pid}/lists`}
          seeAllLabel={tHome("showAllLists")}
        >
          {activeLists === undefined ? (
            <Loading />
          ) : activeLists.length === 0 ? (
            <EmptyLine text={tHome("noActiveLists")} />
          ) : (
            <View style={{ gap: 12 }}>
              {activeLists.map((list) => (
                <ListRow key={list._id} list={list} />
              ))}
            </View>
          )}
        </Widget>

        {isSharedGroup ? (
          <Widget
            label={tNav("expenses")}
            seeAllHref={`/${pid}/expenses`}
            seeAllLabel={tHome("goToPots")}
          >
            {activePots === undefined ? (
              <Loading />
            ) : activePots.length === 0 ? (
              <EmptyLine text={tHome("noActivePots")} />
            ) : (
              <View style={{ gap: 12 }}>
                {activePots.map((pot) => (
                  <PotRow key={pot._id} pot={pot} />
                ))}
              </View>
            )}
          </Widget>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
