import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { CalendarArrowDown } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import type { EventFormValues } from "@/components/event-form";
import { EventForm } from "@/components/event-form";
import { sectionHeaderBadges } from "@/components/header-badges";
import { MonthGrid } from "@/components/month-grid";
import { useTranslations } from "@/i18n";
import { useFormatEventRange, useLongDate } from "@/lib/datetime";
import { isEventOnDay, startOfDay } from "@/lib/event-dates";
import { useProjectId } from "@/lib/project-id";
import { convexSiteUrl } from "@/lib/urls";
import { useTheme } from "@/theme";
import { Card, Fab, Loading, Screen, Txt } from "@/ui";

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

  async function exportCalendar() {
    const token = await getCalendarToken({ projectId: pid });
    const httpsUrl = `${convexSiteUrl()}/calendar.ics?projectId=${pid}&token=${token}`;

    // iOS handles webcal:// natively: Calendar opens and prompts to subscribe
    // to the live feed.
    if (Platform.OS === "ios") {
      await Linking.openURL(httpsUrl.replace(/^https?:\/\//, "webcal://"));
      return;
    }

    // Android calendar apps don't register webcal://. Google Calendar's
    // ?cid=webcal://… link opens a confirm-subscription prompt for the live
    // feed. The webcal URL must be encoded because the feed carries query
    // params (projectId/token) that would otherwise break the outer URL.
    const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");
    const subscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
    try {
      await Linking.openURL(subscribeUrl);
    } catch {
      // No browser/handler available: fall back to sharing the link.
      await Share.share({ message: httpsUrl });
    }
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tCal("title"),
          ...sectionHeaderBadges("calendar", {
            onPress: () => setCreating(true),
            label: tCal("newEvent"),
          }),
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
            {tCal("exportCalendar")}
          </Txt>
        </Pressable>

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

      <Fab onPress={() => setCreating(true)} label={tCal("newEvent")} />
      <EventForm
        visible={creating}
        defaultDate={selectedDay}
        title={tCal("newEvent")}
        onSubmit={handleCreate}
        onClose={() => setCreating(false)}
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
  const formatRange = useFormatEventRange();
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
        {formatRange(event)}
      </Txt>
      {event.description ? (
        <Txt size={14} style={{ marginTop: 6 }} numberOfLines={2}>
          {event.description}
        </Txt>
      ) : null}
    </Card>
  );
}
