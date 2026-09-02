import { type ReactNode, useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Switch, View } from "react-native";
import { MonthGrid } from "@/components/month-grid";
import { type Time, TimeStepper, timeOf } from "@/components/time-stepper";
import { useTranslations } from "@/i18n";
import { useMediumDate } from "@/lib/datetime";
import {
  allDayDisplayEnd,
  inclusiveDayCount,
  sameDay,
  startOfDay,
  utcMidnight,
} from "@/lib/event-dates";
import { useTheme } from "@/theme";
import { Button, Field, Sheet, Txt } from "@/ui";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export type EventFormValues = {
  name: string;
  description: string;
  startAt: number;
  endAt: number;
  allDay: boolean;
};

function timeToMinutes(t: Time): number {
  return t.hour * 60 + t.minute;
}

/** Default timed window: next full hour, 1h long (start capped so end fits today). */
function defaultTimedWindow(): { start: Time; end: Time } {
  const hour = Math.min(new Date().getHours() + 1, 22);
  return {
    start: { hour, minute: 0 },
    end: { hour: hour + 1, minute: 0 },
  };
}

/**
 * When start moves past end on the same calendar day, push end to start+1h.
 * Minutes wrap; hours past 23 spill by bumping `toDay` via the caller.
 */
function endAtLeastOneHourAfter(start: Time): Time {
  const endMinutes = timeToMinutes(start) + 60;
  return {
    hour: Math.floor(endMinutes / 60) % 24,
    minute: endMinutes % 60,
  };
}

function startAtLeastOneHourBefore(end: Time): Time {
  const startMinutes = timeToMinutes(end) - 60;
  if (startMinutes >= 0) {
    return {
      hour: Math.floor(startMinutes / 60),
      minute: startMinutes % 60,
    };
  }
  // End is before 01:00 — clamp start to 00:00 and let the caller keep dates.
  return { hour: 0, minute: 0 };
}

export function EventForm({
  visible,
  initial,
  defaultDate,
  title,
  busy,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  /** Present → edit mode; absent → create mode. */
  initial?: EventFormValues | null;
  defaultDate?: Date;
  title: string;
  busy?: boolean;
  onSubmit: (values: EventFormValues) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const tForm = useTranslations("mobile.eventForm");
  const mediumDate = useMediumDate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [fromDay, setFromDay] = useState(() => startOfDay(new Date()));
  const [toDay, setToDay] = useState(() => startOfDay(new Date()));
  const [startTime, setStartTime] = useState<Time>({ hour: 9, minute: 0 });
  const [endTime, setEndTime] = useState<Time>({ hour: 10, minute: 0 });
  const [pickerMonth, setPickerMonth] = useState(() => startOfDay(new Date()));
  // Which endpoint the next calendar tap sets. Surfaced in the UI (the active
  // row is highlighted) so the two-tap "pick start, pick end" flow is visible.
  const [target, setTarget] = useState<"start" | "end">("start");

  // Read latest props inside the open-transition effect without making them
  // reactive deps (which would reset the form on every parent re-render).
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const defaultDateRef = useRef(defaultDate);
  defaultDateRef.current = defaultDate;

  useEffect(() => {
    if (!visible) {
      return;
    }
    setTarget("start");
    const init = initialRef.current;
    if (init) {
      setName(init.name);
      setDescription(init.description);
      setAllDay(init.allDay);
      const start = startOfDay(new Date(init.startAt));
      const end = init.allDay
        ? startOfDay(allDayDisplayEnd(init.endAt))
        : startOfDay(new Date(init.endAt));
      setFromDay(start);
      setToDay(end);
      setPickerMonth(start);
      if (!init.allDay) {
        setStartTime(timeOf(init.startAt));
        setEndTime(timeOf(init.endAt));
      } else {
        const { start: s, end: e } = defaultTimedWindow();
        setStartTime(s);
        setEndTime(e);
      }
    } else {
      const base = startOfDay(defaultDateRef.current ?? new Date());
      const { start, end } = defaultTimedWindow();
      setName("");
      setDescription("");
      setAllDay(true);
      setFromDay(base);
      setToDay(base);
      setPickerMonth(base);
      setStartTime(start);
      setEndTime(end);
    }
  }, [visible]);

  function handleSelectDay(day: Date) {
    if (target === "start") {
      setFromDay(day);
      // Collapse to a single day when starting fresh (the range is one day) or
      // when the new start jumps past the old end; otherwise keep the end so
      // re-picking just the start preserves the span.
      if (sameDay(fromDay, toDay) || day.getTime() > toDay.getTime()) {
        setToDay(day);
      }
      setTarget("end");
    } else {
      if (day.getTime() >= fromDay.getTime()) {
        setToDay(day);
      } else {
        // Tapping before the start while setting the end grows the range back.
        setFromDay(day);
      }
      setTarget("start");
    }
  }

  function handleStartTimeChange(value: Time) {
    setStartTime(value);
    if (!sameDay(fromDay, toDay)) {
      return;
    }
    if (timeToMinutes(value) >= timeToMinutes(endTime)) {
      const next = endAtLeastOneHourAfter(value);
      // If +1h wraps past midnight on a same-day event, bump the end day.
      if (timeToMinutes(next) <= timeToMinutes(value)) {
        const nextDay = new Date(fromDay);
        nextDay.setDate(nextDay.getDate() + 1);
        setToDay(startOfDay(nextDay));
      }
      setEndTime(next);
    }
  }

  function handleEndTimeChange(value: Time) {
    setEndTime(value);
    if (!sameDay(fromDay, toDay)) {
      return;
    }
    if (timeToMinutes(startTime) >= timeToMinutes(value)) {
      setStartTime(startAtLeastOneHourBefore(value));
    }
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    let startAt: number;
    let endAt: number;
    if (allDay) {
      startAt = utcMidnight(
        fromDay.getFullYear(),
        fromDay.getMonth(),
        fromDay.getDate(),
      );
      endAt = utcMidnight(
        toDay.getFullYear(),
        toDay.getMonth(),
        toDay.getDate(),
      );
    } else {
      startAt = new Date(
        fromDay.getFullYear(),
        fromDay.getMonth(),
        fromDay.getDate(),
        startTime.hour,
        startTime.minute,
      ).getTime();
      endAt = new Date(
        toDay.getFullYear(),
        toDay.getMonth(),
        toDay.getDate(),
        endTime.hour,
        endTime.minute,
      ).getTime();
      // Final guard: never submit a zero/negative duration.
      if (endAt <= startAt) {
        endAt = startAt + 60 * 60 * 1000;
      }
    }
    onSubmit({ name: trimmed, description, startAt, endAt, allDay });
  }

  const multiDay = !sameDay(fromDay, toDay);
  const dayCount = inclusiveDayCount(fromDay, toDay);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        // Fill the sheet when it has an explicit height (keyboard open) so the
        // month grid and save button stay reachable by scrolling.
        style={{ flex: 1, maxHeight: SCREEN_HEIGHT * 0.85 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Txt size={18} weight="700">
          {title}
        </Txt>
        <Field
          placeholder={tForm("namePlaceholder")}
          value={name}
          onChangeText={setName}
        />
        <Field
          placeholder={tForm("descriptionPlaceholder")}
          value={description}
          onChangeText={setDescription}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Txt size={15}>{tForm("allDay")}</Txt>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ true: t.primary, false: t.border }}
          />
        </View>

        {/* Date + time and the picker live in one card so the highlighted row
            and the matching calendar range read as a single connected control. */}
        <View
          style={{
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <EndpointRow
            label={tForm("starts")}
            dateText={mediumDate(fromDay)}
            active={target === "start"}
            allDay={allDay}
            time={startTime}
            onChangeTime={handleStartTimeChange}
            onPress={() => setTarget("start")}
          />
          <View style={{ height: 1, backgroundColor: t.border }} />
          <EndpointRow
            label={tForm("ends")}
            dateText={mediumDate(toDay)}
            active={target === "end"}
            allDay={allDay}
            time={endTime}
            onChangeTime={handleEndTimeChange}
            onPress={() => setTarget("end")}
            trailing={
              multiDay ? (
                <View
                  style={{
                    backgroundColor: `${t.primary}1f`,
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Txt size={11} weight="700" style={{ color: t.primary }}>
                    {tForm("daysCount", { days: dayCount })}
                  </Txt>
                </View>
              ) : null
            }
          />
          <View style={{ height: 1, backgroundColor: t.border }} />
          <View style={{ padding: 8 }}>
            <Txt
              muted
              size={12}
              style={{ paddingHorizontal: 4, paddingBottom: 6 }}
            >
              {tForm("pickHint")}
            </Txt>
            <MonthGrid
              month={pickerMonth}
              onChangeMonth={setPickerMonth}
              onSelectDay={handleSelectDay}
              selectedStart={fromDay}
              selectedEnd={toDay}
            />
          </View>
        </View>

        <Button
          title={busy ? tForm("saving") : tForm("save")}
          disabled={busy || name.trim().length === 0}
          onPress={submit}
        />
      </ScrollView>
    </Sheet>
  );
}

// A start/end endpoint: a tappable row that targets the calendar at this
// endpoint, shows its selected date, an optional trailing chip (the span
// length), and — for timed events — the hour:minute steppers right beside it.
function EndpointRow({
  label,
  dateText,
  active,
  allDay,
  time,
  onChangeTime,
  onPress,
  trailing,
}: {
  label: string;
  dateText: string;
  active: boolean;
  allDay: boolean;
  time: Time;
  onChangeTime: (value: Time) => void;
  onPress: () => void;
  trailing?: ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingRight: 12,
        backgroundColor: active ? `${t.primary}14` : "transparent",
      }}
    >
      {/* Accent rail flags the row the next calendar tap will set. */}
      <View
        style={{
          width: 3,
          alignSelf: "stretch",
          backgroundColor: active ? t.primary : "transparent",
        }}
      />
      <View style={{ flex: 1 }}>
        <Txt
          size={12}
          weight="700"
          style={{ color: active ? t.primary : t.muted, letterSpacing: 0.4 }}
        >
          {label.toUpperCase()}
        </Txt>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 1,
          }}
        >
          <Txt size={16} weight="700">
            {dateText}
          </Txt>
          {trailing}
        </View>
      </View>
      {allDay ? null : <TimeStepper value={time} onChange={onChangeTime} />}
    </Pressable>
  );
}
