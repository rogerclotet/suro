import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { CalendarArrowDown } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";
import type { EventFormValues } from "@/components/event-form";
import { EventForm } from "@/components/event-form";
import { MonthGrid } from "@/components/month-grid";
import { formatTimeRange, isEventOnDay, startOfDay } from "@/lib/event-dates";
import { useProjectId } from "@/lib/project-id";
import { convexSiteUrl } from "@/lib/urls";
import { useTheme } from "@/theme";
import { Card, Fab, Loading, Screen, Txt } from "@/ui";

type CalendarEvent = FunctionReturnType<typeof api.events.listByRange>[number];

// Rotating dot colors, mirroring the PWA's 5 event colors.
const EVENT_COLORS = ["#1e66f5", "#fe640b", "#40a02b", "#8839ef", "#179299"];

export default function CalendarScreen() {
  const pid = useProjectId();
  const router = useRouter();
  const t = useTheme();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [creating, setCreating] = useState(false);

  const monthStart = new Date(
    month.getFullYear(),
    month.getMonth(),
    1,
  ).getTime();
  const monthEnd = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  ).getTime();

  const events = useQuery(api.events.listByRange, {
    projectId: pid,
    from: monthStart,
    to: monthEnd,
  });
  const createEvent = useMutation(api.events.create);
  const getCalendarToken = useMutation(api.events.getOrCreateCalendarToken);

  const colorById = useMemo(() => {
    const map = new Map<Id<"events">, string>();
    (events ?? []).forEach((event, index) => {
      map.set(event._id, EVENT_COLORS[index % EVENT_COLORS.length] as string);
    });
    return map;
  }, [events]);

  function dotsForDay(day: Date): { key: string; color: string }[] {
    if (!events) {
      return [];
    }
    return events
      .filter((event) => isEventOnDay(event, day))
      .slice(0, 3)
      .map((event) => ({
        key: event._id,
        color: colorById.get(event._id) ?? (EVENT_COLORS[0] as string),
      }));
  }

  const selectedEvents = useMemo(
    () => (events ?? []).filter((event) => isEventOnDay(event, selectedDay)),
    [events, selectedDay],
  );

  async function handleCreate(values: EventFormValues) {
    setCreating(false);
    await createEvent({ projectId: pid, ...values });
  }

  async function exportCalendar() {
    const token = await getCalendarToken({ projectId: pid });
    const url = `${convexSiteUrl()}/calendar.ics?projectId=${pid}&token=${token}`;
    // Native share sheet lets the user copy or send the subscribable feed URL.
    await Share.share({ message: url, url });
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Calendar",
          headerLeft: () => (
            <Pressable onPress={() => router.navigate("/projects")} hitSlop={8}>
              <Txt style={{ color: t.primary }}>Groups</Txt>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        <MonthGrid
          month={month}
          onChangeMonth={setMonth}
          onSelectDay={setSelectedDay}
          selectedStart={selectedDay}
          dotsForDay={dotsForDay}
        />

        <Pressable
          onPress={exportCalendar}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 12,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 12,
            paddingVertical: 11,
          }}
        >
          <CalendarArrowDown color={t.primary} size={18} />
          <Txt size={15} style={{ color: t.primary }}>
            Export calendar
          </Txt>
        </Pressable>

        <Txt size={17} weight="700" style={{ marginTop: 20, marginBottom: 8 }}>
          {selectedDay.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Txt>

        {events === undefined ? (
          <Loading />
        ) : selectedEvents.length === 0 ? (
          <Txt muted style={{ fontStyle: "italic", paddingVertical: 8 }}>
            No events scheduled for this day.
          </Txt>
        ) : (
          <View style={{ gap: 12 }}>
            {selectedEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onPress={() => router.push(`/${pid}/calendar/${event._id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {!creating && <Fab onPress={() => setCreating(true)} />}
      <EventForm
        visible={creating}
        defaultDate={selectedDay}
        title="New event"
        onSubmit={handleCreate}
        onClose={() => setCreating(false)}
      />
    </Screen>
  );
}

function EventCard({
  event,
  onPress,
}: {
  event: CalendarEvent;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <Txt size={16} weight="700">
        {event.name}
      </Txt>
      <Txt muted size={13} style={{ marginTop: 2 }}>
        {formatTimeRange(event)}
      </Txt>
      {event.description ? (
        <Txt size={14} style={{ marginTop: 6 }} numberOfLines={2}>
          {event.description}
        </Txt>
      ) : null}
    </Card>
  );
}
