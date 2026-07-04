import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { CalendarSync } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import type { EventFormValues } from "@/components/event-form";
import { EventForm } from "@/components/event-form";
import { ExportCalendarSheet } from "@/components/export-calendar-sheet";
import { sectionHeaderBadges } from "@/components/header-badges";
import { MonthGrid, monthGridRange } from "@/components/month-grid";
import { useTranslations } from "@/i18n";
import { useFormatEventTime, useLongDate } from "@/lib/datetime";
import { endOfDay, isEventOnDay, startOfDay } from "@/lib/event-dates";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Card, Fab, Loading, Screen, Txt, useFabScroll } from "@/ui";

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
  const [creating, setCreating] = useState(false);
  const fab = useFabScroll();
  const [exporting, setExporting] = useState(false);

  // Query the whole visible 6-week grid, not just the calendar month, so events
  // on the leading/trailing days of the adjacent months (shown at the grid's
  // edges) still get their dots and appear when such a day is selected.
  const { from, to } = useMemo(() => {
    const { start, end } = monthGridRange(month);
    return { from: startOfDay(start).getTime(), to: endOfDay(end).getTime() };
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
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        onScroll={fab.onScroll}
        scrollEventThrottle={16}
      >
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
          <View style={{ gap: 12 }}>
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

function EventCard({
  event,
  color,
  onPress,
}: {
  event: CalendarEvent;
  color: string;
  onPress: () => void;
}) {
  const formatTime = useFormatEventTime();
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          }}
        />
        <Txt size={16} weight="700" style={{ flex: 1 }}>
          {event.name}
        </Txt>
      </View>
      <Txt muted size={13} style={{ marginTop: 2 }}>
        {formatTime(event)}
      </Txt>
      {event.description ? (
        <Txt size={14} style={{ marginTop: 6 }} numberOfLines={2}>
          {event.description}
        </Txt>
      ) : null}
    </Card>
  );
}
