import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Switch, View } from "react-native";
import { MonthGrid } from "@/components/month-grid";
import { useTranslations } from "@/i18n";
import { allDayDisplayEnd, startOfDay, utcMidnight } from "@/lib/event-dates";
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

type Time = { hour: number; minute: number };

function timeOf(ms: number): Time {
  const d = new Date(ms);
  return { hour: d.getHours(), minute: d.getMinutes() };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [fromDay, setFromDay] = useState(() => startOfDay(new Date()));
  const [toDay, setToDay] = useState(() => startOfDay(new Date()));
  const [startTime, setStartTime] = useState<Time>({ hour: 9, minute: 0 });
  const [endTime, setEndTime] = useState<Time>({ hour: 10, minute: 0 });
  const [pickerMonth, setPickerMonth] = useState(() => startOfDay(new Date()));
  const selectingEnd = useRef(false);

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
    selectingEnd.current = false;
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
    if (!selectingEnd.current) {
      setFromDay(day);
      setToDay(day);
      selectingEnd.current = true;
    } else {
      if (day.getTime() >= fromDay.getTime()) {
        setToDay(day);
      } else {
        setToDay(fromDay);
        setFromDay(day);
      }
      selectingEnd.current = false;
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

        {!allDay ? (
          <View style={{ gap: 8 }}>
            <TimeRow
              label={tForm("starts")}
              value={startTime}
              onChange={setStartTime}
            />
            <TimeRow
              label={tForm("ends")}
              value={endTime}
              onChange={setEndTime}
            />
          </View>
        ) : null}

        <View
          style={{
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 12,
            padding: 8,
          }}
        >
          <MonthGrid
            month={pickerMonth}
            onChangeMonth={setPickerMonth}
            onSelectDay={handleSelectDay}
            selectedStart={fromDay}
            selectedEnd={toDay}
          />
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

function TimeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Time;
  onChange: (value: Time) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Txt size={15}>{label}</Txt>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Stepper
          value={value.hour}
          onChange={(hour) => onChange({ ...value, hour: (hour + 24) % 24 })}
        />
        <Txt size={18} weight="700">
          :
        </Txt>
        <Stepper
          value={value.minute}
          step={5}
          onChange={(minute) =>
            onChange({ ...value, minute: (minute + 60) % 60 })
          }
        />
      </View>
    </View>
  );
}

function Stepper({
  value,
  step = 1,
  onChange,
}: {
  value: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        onPress={() => onChange(value + step)}
        hitSlop={6}
        style={{ padding: 2 }}
      >
        <ChevronUp color={t.primary} size={20} />
      </Pressable>
      <Txt size={18} weight="700" style={{ minWidth: 28, textAlign: "center" }}>
        {pad(value)}
      </Txt>
      <Pressable
        onPress={() => onChange(value - step)}
        hitSlop={6}
        style={{ padding: 2 }}
      >
        <ChevronDown color={t.primary} size={20} />
      </Pressable>
    </View>
  );
}
