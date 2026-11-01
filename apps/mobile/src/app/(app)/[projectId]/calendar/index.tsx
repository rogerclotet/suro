import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { calendarQueryBounds, eventLocalStart } from "domain/events";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CalendarSync } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { EventFormValues } from "@/components/event-form";
import { EventForm } from "@/components/event-form";
import { ExportCalendarSheet } from "@/components/export-calendar-sheet";
import { sectionHeaderBadges } from "@/components/header-badges";
import { MonthGrid, monthGridRange } from "@/components/month-grid";
import { UnreadDot } from "@/components/unread-badge";
import { useLocale, useTranslations } from "@/i18n";
import { useFormatEventTime, useLongDate } from "@/lib/datetime";
import { isEventOnDay, startOfDay } from "@/lib/event-dates";
import { unreadItems } from "@/lib/notification-routing";
import {
  useUnreadItemCount,
  useUnreadNotifications,
} from "@/lib/notifications";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Fab, Loading, Screen, Txt, useFabScroll } from "@/ui";

type CalendarEvent = FunctionReturnType<typeof api.events.listByRange>[number];

export default function CalendarScreen() {
  const pid = useProjectId();
  const router = useRouter();
  const t = useTheme();
  const tCal = useTranslations("mobile.calendar");
  const longDate = useLongDate();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  // Home's "events today" opens today even when an earlier visit left the
  // calendar on another day. Each tap sends its own time, so a repeat tap
  // still moves the calendar.
  const { today } = useLocalSearchParams<{ today?: string }>();
  const [shownToday, setShownToday] = useState(today);
  if (today !== shownToday) {
    setShownToday(today);
    const day = new Date(Number(today));
    if (today && Number.isFinite(day.getTime())) {
      setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
      setSelectedDay(startOfDay(day));
    }
  }
  const [creating, setCreating] = useState(false);
  const fab = useFabScroll();
  const [exporting, setExporting] = useState(false);

  // Query the whole visible 6-week grid, not just the calendar month, so events
  // on the leading/trailing days of the adjacent months (shown at the grid's
  // edges) still get their dots and appear when such a day is selected.
  const { from, to } = useMemo(() => {
    const { start, end } = monthGridRange(month);
    return calendarQueryBounds(start, end);
  }, [month]);

  const events = usePersistentQuery(api.events.listByRange, {
    projectId: pid,
    from,
    to,
  });
  const createEvent = useMutation(api.events.create);

  // Each event gets a stable Catppuccin accent (theme-aware: Latte on light,
  // Mocha on dark), reused for both its calendar dots and its list card.
  const colorById = useMemo(() => {
    const map = new Map<Id<"events">, { color: string; onPrimary: string }>();
    (events ?? []).forEach((event, index) => {
      const i = index % t.event.length;
      map.set(event._id, {
        color: t.event[i] as string,
        onPrimary: t.eventOnPrimary[i] as string,
      });
    });
    return map;
  }, [events, t.event, t.eventOnPrimary]);

  function dotsForDay(
    day: Date,
  ): { key: string; color: string; onPrimary: string }[] {
    if (!events) {
      return [];
    }
    return events
      .filter((event) => isEventOnDay(event, day))
      .slice(0, 3)
      .map((event) => {
        const accent = colorById.get(event._id);
        return {
          key: event._id,
          color: accent?.color ?? (t.event[0] as string),
          onPrimary: accent?.onPrimary ?? (t.eventOnPrimary[0] as string),
        };
      });
  }

  const selectedEvents = useMemo(
    () => (events ?? []).filter((event) => isEventOnDay(event, selectedDay)),
    [events, selectedDay],
  );

  async function handleCreate(values: EventFormValues) {
    setCreating(false);
    await createEvent({ projectId: pid, ...values });
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tCal("title"),
          ...sectionHeaderBadges(
            "calendar",
            {
              onPress: () => setCreating(true),
              label: tCal("newEvent"),
            },
            [
              {
                icon: CalendarSync,
                onPress: () => setExporting(true),
                label: tCal("exportCalendar"),
              },
            ],
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          // Slightly tighter horizontal padding so the month grid's day tiles
          // can grow — they fill their flex cells.
          paddingHorizontal: 10,
          paddingTop: 12,
          paddingBottom: 96,
        }}
        onScroll={fab.onScroll}
        scrollEventThrottle={16}
      >
        <NewEvents
          onOpen={(eventId) => router.push(`/${pid}/calendar/${eventId}`)}
        />
        <MonthGrid
          month={month}
          onChangeMonth={setMonth}
          onSelectDay={setSelectedDay}
          selectedStart={selectedDay}
          dotsForDay={dotsForDay}
          swipeToChangeMonth
        />

        <Txt size={17} weight="700" style={{ marginTop: 20, marginBottom: 8 }}>
          {longDate(selectedDay)}
        </Txt>

        {events === undefined ? (
          <Loading />
        ) : selectedEvents.length === 0 ? (
          <Txt muted style={{ fontStyle: "italic", paddingVertical: 8 }}>
            {tCal("noEventsForDay")}
          </Txt>
        ) : (
          <View style={{ gap: 0 }}>
            {selectedEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                color={
                  colorById.get(event._id)?.color ?? (t.event[0] as string)
                }
                onPress={() => router.push(`/${pid}/calendar/${event._id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Fab
        onPress={() => setCreating(true)}
        label={tCal("newEvent")}
        extended={fab.extended}
      />
      <EventForm
        visible={creating}
        defaultDate={selectedDay}
        title={tCal("newEvent")}
        onSubmit={handleCreate}
        onClose={() => setCreating(false)}
      />
      <ExportCalendarSheet
        projectId={pid}
        visible={exporting}
        onClose={() => setExporting(false)}
      />
    </Screen>
  );
}

type NewEvent = { id: string; name: string; startAt: number; allDay: boolean };

/**
 * Events other members added since the user last opened them. They can fall in
 * any month, so the grid's dots alone wouldn't lead the user to them.
 */
function NewEvents({ onOpen }: { onOpen: (eventId: string) => void }) {
  const pid = useProjectId();
  const unread = useUnreadNotifications();
  const t = useTheme();
  const locale = useLocale();
  const tCal = useTranslations("mobile.calendar");
  const events = unreadItems(unread, pid, "calendar")
    .flatMap((item): NewEvent[] =>
      item.event && !item.gone ? [{ id: item.id, ...item.event }] : [],
    )
    .sort((a, b) => a.startAt - b.startAt);
  if (events.length === 0) return null;

  return (
    <View style={{ gap: 4, marginBottom: 16, paddingHorizontal: 2 }}>
      <Txt muted size={12} style={{ letterSpacing: 1 }}>
        {tCal("newEvents").toUpperCase()}
      </Txt>
      {events.map((event) => (
        <Pressable
          key={event.id}
          onPress={() => onOpen(event.id)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <UnreadDot count={1} />
          <Txt weight="700" numberOfLines={1} style={{ flex: 1 }}>
            {event.name}
          </Txt>
          <Txt muted size={13}>
            {eventLocalStart(event).toLocaleDateString(locale, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

function EventCard({
  event,
  color,
  onPress,
}: {
  event: CalendarEvent;
  color: string;
  onPress: () => void;
}) {
  const t = useTheme();
  const formatTime = useFormatEventTime();
  const changes = useUnreadItemCount(event.projectId, event._id);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "stretch",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 2,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 4,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Txt
            size={16}
            weight="700"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {event.name}
          </Txt>
          <UnreadDot count={changes} />
        </View>
        <Txt muted size={13}>
          {formatTime(event)}
        </Txt>
        {event.description ? (
          <Txt muted size={14} style={{ marginTop: 2 }} numberOfLines={2}>
            {event.description}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}
