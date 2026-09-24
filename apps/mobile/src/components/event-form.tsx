import {
  changeEventDays,
  changeEventEnd,
  changeEventStart,
  createEventDateDraft,
  type EventDateDraft,
  editEventDateDraft,
  eventDatesForMutation,
  toggleEventAllDay,
} from "domain/events";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Switch, View } from "react-native";
import { MonthGrid } from "@/components/month-grid";
import { type Time, TimeStepper, timeOf } from "@/components/time-stepper";
import { useTranslations } from "@/i18n";
import { useMediumDate } from "@/lib/datetime";
import { inclusiveDayCount, sameDay, startOfDay } from "@/lib/event-dates";
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
  const [draft, setDraft] = useState<EventDateDraft>(() =>
    createEventDateDraft(new Date()),
  );
  const { allDay } = draft;
  const fromDay = startOfDay(draft.dates.from);
  const toDay = startOfDay(draft.dates.to);
  const startTime = timeOf(draft.dates.from.getTime());
  const endTime = timeOf(draft.dates.to.getTime());
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
    const next = init
      ? editEventDateDraft(init)
      : createEventDateDraft(defaultDateRef.current ?? new Date());
    setName(init?.name ?? "");
    setDescription(init?.description ?? "");
    setDraft(next);
    setPickerMonth(startOfDay(next.dates.from));
  }, [visible]);

  function handleSelectDay(day: Date) {
    const days =
      target === "start"
        ? {
            from: day,
            to: sameDay(fromDay, toDay) || day > toDay ? day : toDay,
          }
        : {
            from: day < fromDay ? day : fromDay,
            to: day < fromDay ? toDay : day,
          };
    setDraft(changeEventDays(draft, days));
    setTarget(target === "start" ? "end" : "start");
  }

  function handleStartTimeChange(value: Time) {
    const from = new Date(draft.dates.from);
    from.setHours(value.hour, value.minute, 0, 0);
    setDraft({ allDay: false, dates: changeEventStart(draft.dates, from) });
  }

  function handleEndTimeChange(value: Time) {
    const to = new Date(draft.dates.to);
    to.setHours(value.hour, value.minute, 0, 0);
    setDraft({ allDay: false, dates: changeEventEnd(draft.dates, to) });
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, description, ...eventDatesForMutation(draft) });
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
          autoFocus={!initial}
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
            onValueChange={(checked) =>
              setDraft(toggleEventAllDay(draft, checked))
            }
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
