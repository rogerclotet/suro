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
      }
    } else {
      const base = startOfDay(defaultDateRef.current ?? new Date());
      const hour = Math.min(new Date().getHours() + 1, 23);
      setName("");
      setDescription("");
      setAllDay(true);
      setFromDay(base);
      setToDay(base);
      setPickerMonth(base);
      setStartTime({ hour, minute: 0 });
      setEndTime({ hour: Math.min(hour + 1, 23), minute: 0 });
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
    }
    onSubmit({ name: trimmed, description, startAt, endAt, allDay });
  }

  const multiDay = !sameDay(fromDay, toDay);
  const dayCount = inclusiveDayCount(fromDay, toDay);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        style={{ maxHeight: SCREEN_HEIGHT * 0.72 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12 }}
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
            onChangeTime={setStartTime}
            onPress={() => setTarget("start")}
          />
          <View style={{ height: 1, backgroundColor: t.border }} />
          <EndpointRow
            label={tForm("ends")}
            dateText={mediumDate(toDay)}
            active={target === "end"}
            allDay={allDay}
            time={endTime}
            onChangeTime={setEndTime}
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
