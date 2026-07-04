import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import {
  CalendarClock,
  Flag,
  Repeat,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { Avatar } from "@/components/avatar";
import {
  CategoryPickerPanel,
  type PickerCategory,
} from "@/components/category-picker";
import { MonthGrid } from "@/components/month-grid";
import { type Time, TimeStepper, timeOf } from "@/components/time-stepper";
import { useLocale, useTranslations } from "@/i18n";
import { startOfDay, utcMidnight } from "@/lib/event-dates";
import { usePersistentQuery } from "@/lib/offline";
import {
  type Priority,
  presetForRecurrence,
  type RepeatPreset,
  recurrenceForPreset,
} from "@/lib/recurrence";
import { useTheme } from "@/theme";
import { Button, Section, Sheet, Txt } from "@/ui";

type Member = FunctionReturnType<typeof api.projects.members>[number];

/** A list item's task fields, as the only ones used by create/update. */
export type ItemTaskFields = Pick<
  Doc<"listItems">,
  "dueAt" | "dueAllDay" | "assigneeId" | "priority" | "recurrence"
>;

/**
 * The editable task state held by the item sheet. `dueAt` is null when the task
 * has no due date; `priority` defaults to "normal"; `repeat` is a preset chip.
 */
export type TaskDraft = {
  dueAt: number | null;
  dueAllDay: boolean;
  assigneeId: Id<"users"> | null;
  priority: Priority;
  repeat: RepeatPreset;
};

export const EMPTY_TASK_DRAFT: TaskDraft = {
  dueAt: null,
  dueAllDay: true,
  assigneeId: null,
  priority: "normal",
  repeat: "none",
};

/** Seed the draft from an item being edited. */
export function taskDraftFromItem(item: ItemTaskFields): TaskDraft {
  return {
    dueAt: item.dueAt ?? null,
    dueAllDay: item.dueAllDay ?? true,
    assigneeId: item.assigneeId ?? null,
    priority: item.priority ?? "normal",
    repeat: presetForRecurrence(item.recurrence),
  };
}

/**
 * Convert the draft to the task-field args sent to `listItems.create/update`.
 * A "normal" priority and a "none" repeat collapse to undefined (the defaults),
 * so a plain edit on a task item writes no redundant fields; the update mutation
 * clears any omitted field, which is the intended "unset" behavior.
 */
export function taskDraftToArgs(draft: TaskDraft): ItemTaskFields {
  return {
    dueAt: draft.dueAt ?? undefined,
    dueAllDay: draft.dueAt === null ? undefined : draft.dueAllDay,
    assigneeId: draft.assigneeId ?? undefined,
    priority: draft.priority === "normal" ? undefined : draft.priority,
    recurrence: recurrenceForPreset(draft.repeat),
  };
}

const PRIORITY_KEYS: Priority[] = ["low", "normal", "high"];
const REPEAT_KEYS: RepeatPreset[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

/** Theme color for a priority indicator (normal is muted/no accent). */
export function priorityColor(
  t: ReturnType<typeof useTheme>,
  priority: Priority,
): string {
  return priority === "high"
    ? t.danger
    : priority === "low"
      ? t.muted
      : t.primary;
}

/**
 * Localized due-date label. All-day dues show just the date; timed dues append
 * the clock time. Used by the editor and the row chip.
 */
export function useFormatDue(): (item: {
  dueAt: number;
  dueAllDay?: boolean;
}) => string {
  const locale = useLocale();
  return ({ dueAt, dueAllDay }) => {
    const date = new Date(dueAt);
    const dateLabel = date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    });
    if (dueAllDay) {
      return dateLabel;
    }
    const timeLabel = date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateLabel} ${timeLabel}`;
  };
}

/**
 * The "Task list" switch row shared by the create-list sheet and a list's
 * settings, with a one-line explainer. Flipping it on enables the per-item due
 * date / assignee / priority / repeat affordances.
 */
export function TaskListToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Txt size={16} weight="700">
          {tl("taskList")}
        </Txt>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: t.primary, false: t.border }}
        />
      </View>
      <Txt muted size={13}>
        {tl("taskListHint")}
      </Txt>
    </View>
  );
}

/** Compact icon triggers for the inline add row (category / due / assignee / priority / repeat). */
export function NewItemTaskControls({
  projectId,
  draft,
  onChange,
  categories,
  category,
  onChangeCategory,
  onCategorySelected,
}: {
  projectId: Id<"projects">;
  draft: TaskDraft;
  onChange: (draft: TaskDraft) => void;
  categories?: PickerCategory[];
  category?: string | null;
  onChangeCategory?: (category: string | null) => void;
  onCategorySelected?: () => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tlists = useTranslations("lists");
  const tc = useTranslations("mobile.common");
  const formatDue = useFormatDue();
  const members = usePersistentMembers(projectId);
  const [sheet, setSheet] = useState<
    "category" | "due" | "assignee" | "priority" | "repeat" | null
  >(null);

  const assignee =
    draft.assigneeId !== null
      ? members?.find((member) => member._id === draft.assigneeId)
      : undefined;

  function closeSheet() {
    setSheet(null);
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {categories !== undefined && onChangeCategory !== undefined ? (
          <TaskControlChip
            icon={Tag}
            label={category ?? tlists("categoryLabel")}
            active={category !== null && category !== undefined}
            onPress={() => setSheet("category")}
          />
        ) : null}
        <TaskControlChip
          icon={UserIcon}
          label={assignee?.name ?? tl("assignee")}
          active={draft.assigneeId !== null}
          onPress={() => setSheet("assignee")}
        />
        <TaskControlChip
          icon={Flag}
          label={tl(`priority_${draft.priority}`)}
          active={draft.priority !== "normal"}
          accent={priorityColor(t, draft.priority)}
          onPress={() => setSheet("priority")}
        />
        <TaskControlChip
          icon={CalendarClock}
          label={
            draft.dueAt !== null
              ? formatDue({ dueAt: draft.dueAt, dueAllDay: draft.dueAllDay })
              : tl("dueDate")
          }
          active={draft.dueAt !== null}
          onPress={() => setSheet("due")}
        />
        <TaskControlChip
          icon={Repeat}
          label={tl(`repeat_${draft.repeat}`)}
          active={draft.repeat !== "none"}
          onPress={() => setSheet("repeat")}
        />
      </ScrollView>

      <Sheet visible={sheet !== null} onClose={closeSheet}>
        {sheet === "category" &&
        categories !== undefined &&
        onChangeCategory ? (
          <>
            <Txt size={18} weight="700">
              {tlists("categoryLabel")}
            </Txt>
            <CategoryPickerPanel
              categories={categories}
              value={category ?? null}
              onChange={(next) => {
                onChangeCategory(next);
                closeSheet();
                onCategorySelected?.();
              }}
              autoFocus
            />
          </>
        ) : null}
        {sheet === "due" ? (
          <>
            <Txt size={18} weight="700">
              {tl("dueDate")}
            </Txt>
            <DueDateField draft={draft} onChange={onChange} />
            <Button title={tc("save")} onPress={closeSheet} />
          </>
        ) : null}
        {sheet === "assignee" ? (
          <>
            <Txt size={18} weight="700">
              {tl("assignee")}
            </Txt>
            <AssigneePicker
              projectId={projectId}
              value={draft.assigneeId}
              onChange={(assigneeId) => {
                onChange({ ...draft, assigneeId });
                closeSheet();
              }}
            />
          </>
        ) : null}
        {sheet === "priority" ? (
          <>
            <Txt size={18} weight="700">
              {tl("priority")}
            </Txt>
            <PriorityPicker
              value={draft.priority}
              onChange={(priority) => {
                onChange({ ...draft, priority });
                closeSheet();
              }}
            />
          </>
        ) : null}
        {sheet === "repeat" ? (
          <>
            <Txt size={18} weight="700">
              {tl("repeat")}
            </Txt>
            <RepeatPicker
              value={draft.repeat}
              onChange={(repeat) => {
                onChange({ ...draft, repeat });
                closeSheet();
              }}
            />
          </>
        ) : null}
      </Sheet>
    </>
  );
}

function TaskControlChip({
  icon: Icon,
  label,
  active,
  accent,
  onPress,
}: {
  icon: typeof CalendarClock;
  label: string;
  active: boolean;
  accent?: string;
  onPress: () => void;
}) {
  const t = useTheme();
  const color = active ? (accent ?? t.primary) : t.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: active ? (accent ?? t.primary) : t.border,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: active ? `${accent ?? t.primary}1a` : "transparent",
        maxWidth: 160,
      }}
    >
      <Icon color={color} size={14} />
      <Txt
        size={13}
        numberOfLines={1}
        style={{ color: active ? color : t.text }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

/** The full task-fields editor block rendered inside the item sheet. */
export function TaskFieldsEditor({
  projectId,
  draft,
  onChange,
}: {
  projectId: Id<"projects">;
  draft: TaskDraft;
  onChange: (draft: TaskDraft) => void;
}) {
  const tl = useTranslations("mobile.lists");
  return (
    <>
      <Section label={tl("assignee")}>
        <AssigneePicker
          projectId={projectId}
          value={draft.assigneeId}
          onChange={(assigneeId) => onChange({ ...draft, assigneeId })}
        />
      </Section>
      <Section label={tl("priority")}>
        <PriorityPicker
          value={draft.priority}
          onChange={(priority) => onChange({ ...draft, priority })}
        />
      </Section>
      <Section label={tl("dueDate")}>
        <DueDateField draft={draft} onChange={onChange} />
      </Section>
      <Section label={tl("repeat")}>
        <RepeatPicker
          value={draft.repeat}
          onChange={(repeat) => onChange({ ...draft, repeat })}
        />
      </Section>
    </>
  );
}

/**
 * Compute a `dueAt` epoch-ms from a local day plus the all-day flag/time:
 * UTC-midnight of the day for all-day (a point), or the full local timestamp
 * otherwise — matching how the backend stores and reschedules dues.
 */
function dueAtFor(day: Date, allDay: boolean, time: Time): number {
  if (allDay) {
    return utcMidnight(day.getFullYear(), day.getMonth(), day.getDate());
  }
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time.hour,
    time.minute,
  ).getTime();
}

/** The day a stored `dueAt` falls on, in the local zone (for all-day, from UTC). */
function dayOfDue(dueAt: number, allDay: boolean): Date {
  if (allDay) {
    const d = new Date(dueAt);
    // All-day dues are UTC midnight; read the calendar day back in UTC, then
    // rebuild it as a local day so the picker highlights the intended date.
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  return startOfDay(new Date(dueAt));
}

function DueDateField({
  draft,
  onChange,
}: {
  draft: TaskDraft;
  onChange: (draft: TaskDraft) => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const formatDue = useFormatDue();
  const hasDue = draft.dueAt !== null;
  const day = hasDue
    ? dayOfDue(draft.dueAt as number, draft.dueAllDay)
    : startOfDay(new Date());
  const time: Time = hasDue
    ? timeOf(draft.dueAt as number)
    : { hour: 9, minute: 0 };
  const [pickerMonth, setPickerMonth] = useState(day);

  function setDay(nextDay: Date): void {
    onChange({ ...draft, dueAt: dueAtFor(nextDay, draft.dueAllDay, time) });
  }
  function setAllDay(allDay: boolean): void {
    onChange({
      ...draft,
      dueAllDay: allDay,
      dueAt: hasDue ? dueAtFor(day, allDay, time) : draft.dueAt,
    });
  }
  function setTime(nextTime: Time): void {
    onChange({ ...draft, dueAt: dueAtFor(day, draft.dueAllDay, nextTime) });
  }

  if (!hasDue) {
    return (
      <Pressable
        onPress={() => setDay(startOfDay(new Date()))}
        accessibilityRole="button"
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 6,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <CalendarClock color={t.muted} size={14} />
        <Txt size={14} muted>
          {tl("setDueDate")}
        </Txt>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
        }}
      >
        <Txt size={16} weight="700">
          {formatDue({
            dueAt: draft.dueAt as number,
            dueAllDay: draft.dueAllDay,
          })}
        </Txt>
        <Pressable
          onPress={() => onChange({ ...draft, dueAt: null })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tl("clearDueDate")}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
        >
          <X color={t.muted} size={18} />
        </Pressable>
      </View>
      <View style={{ height: 1, backgroundColor: t.border }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Txt size={15}>{tl("allDay")}</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {draft.dueAllDay ? null : (
            <TimeStepper value={time} onChange={setTime} />
          )}
          <Switch
            value={draft.dueAllDay}
            onValueChange={setAllDay}
            trackColor={{ true: t.primary, false: t.border }}
          />
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: t.border }} />
      <View style={{ padding: 8 }}>
        <MonthGrid
          month={pickerMonth}
          onChangeMonth={setPickerMonth}
          onSelectDay={setDay}
          selectedStart={day}
          selectedEnd={day}
        />
      </View>
    </View>
  );
}

function AssigneePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: Id<"projects">;
  value: Id<"users"> | null;
  onChange: (assigneeId: Id<"users"> | null) => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const members = usePersistentMembers(projectId);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      <UnassignedChip
        active={value === null}
        label={tl("unassigned")}
        onPress={() => onChange(null)}
      />
      {(members ?? []).map((member) => {
        const active = member._id === value;
        return (
          <Pressable
            key={member._id}
            onPress={() => onChange(member._id)}
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderWidth: 1,
              borderColor: active ? t.primary : t.border,
              borderRadius: 999,
              paddingLeft: 4,
              paddingRight: 10,
              paddingVertical: 4,
              backgroundColor: active ? `${t.primary}1a` : "transparent",
            }}
          >
            <Avatar
              name={member.name}
              image={member.image}
              color={member.avatarColor}
              size={24}
            />
            <Txt
              size={14}
              numberOfLines={1}
              style={active ? { color: t.primary } : undefined}
            >
              {member.name ?? tl("unknownMember")}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function UnassignedChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: active ? `${t.primary}1a` : "transparent",
      }}
    >
      <UserIcon color={active ? t.primary : t.muted} size={14} />
      <Txt
        size={14}
        muted={!active}
        style={active ? { color: t.primary } : undefined}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {PRIORITY_KEYS.map((key, index) => {
        const active = key === value;
        const accent = priorityColor(t, key);
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 11,
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: t.border,
              backgroundColor: active ? `${accent}1f` : "transparent",
            }}
          >
            <Flag
              color={active ? accent : t.muted}
              fill={active ? accent : "none"}
              size={14}
            />
            <Txt
              size={14}
              weight={active ? "700" : "400"}
              style={{ color: active ? accent : t.text }}
            >
              {tl(`priority_${key}`)}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function RepeatPicker({
  value,
  onChange,
}: {
  value: RepeatPreset;
  onChange: (repeat: RepeatPreset) => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {REPEAT_KEYS.map((key) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderWidth: 1,
              borderColor: active ? t.primary : t.border,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: active ? `${t.primary}1a` : "transparent",
            }}
          >
            {key !== "none" ? (
              <Repeat color={active ? t.primary : t.muted} size={13} />
            ) : null}
            <Txt
              size={14}
              muted={!active}
              style={active ? { color: t.primary } : undefined}
            >
              {tl(`repeat_${key}`)}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The project's members, cached offline like the rest of the lists surface. */
function usePersistentMembers(projectId: Id<"projects">): Member[] | undefined {
  return usePersistentQuery(api.projects.members, { projectId });
}
