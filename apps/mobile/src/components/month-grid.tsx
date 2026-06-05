import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useMonthLabel, useWeekdayShortLabels } from "@/lib/datetime";
import { sameDay } from "@/lib/event-dates";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

/** The 42 cells (6 weeks) starting on the Monday on/before the 1st. */
function monthCells(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Mon = 0
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
  });
}

function isBetween(day: Date, start: Date, end: Date): boolean {
  const d = day.getTime();
  const lo = Math.min(start.getTime(), end.getTime());
  const hi = Math.max(start.getTime(), end.getTime());
  return d >= lo && d <= hi;
}

// Height of the connecting range bar; matches the day circle so the highlight
// reads as one continuous pill flowing through the endpoint circles.
const RANGE_BAR = 34;

/**
 * Reusable Monday-first month grid. Drives the calendar view (with event dots)
 * and the event form's date-range picker (with start/end highlighting).
 */
export function MonthGrid({
  month,
  onChangeMonth,
  onSelectDay,
  selectedStart,
  selectedEnd,
  dotsForDay,
}: {
  month: Date;
  onChangeMonth: (firstOfMonth: Date) => void;
  onSelectDay: (day: Date) => void;
  selectedStart?: Date | null;
  selectedEnd?: Date | null;
  /** Up to a few event markers per day; `key` must be stable (e.g. event id). */
  dotsForDay?: (day: Date) => { key: string; color: string }[];
}) {
  const t = useTheme();
  const cells = monthCells(month);
  const today = new Date();
  const monthLabelOf = useMonthLabel();
  const weekdays = useWeekdayShortLabels();

  function shiftMonth(delta: number) {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  const monthLabel = monthLabelOf(month);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={() => shiftMonth(-1)}
          hitSlop={10}
          style={{ padding: 6 }}
        >
          <ChevronLeft color={t.primary} size={22} />
        </Pressable>
        <Txt size={16} weight="700">
          {monthLabel}
        </Txt>
        <Pressable
          onPress={() => shiftMonth(1)}
          hitSlop={10}
          style={{ padding: 6 }}
        >
          <ChevronRight color={t.primary} size={22} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row" }}>
        {weekdays.map((label) => (
          <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <Txt muted size={11} style={{ letterSpacing: 0.5 }}>
              {label.toUpperCase()}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = sameDay(day, today);
          const isStart = selectedStart ? sameDay(day, selectedStart) : false;
          const isEnd = selectedEnd ? sameDay(day, selectedEnd) : false;
          const isEndpoint = isStart || isEnd;
          // A range only exists when both ends are set to *different* days; a
          // lone selected day (or a same-day pick) just gets the endpoint circle.
          const hasRange = Boolean(
            selectedStart &&
              selectedEnd &&
              !sameDay(selectedStart, selectedEnd),
          );
          const inRange =
            hasRange && selectedStart && selectedEnd
              ? isBetween(day, selectedStart, selectedEnd)
              : false;
          const dots = dotsForDay?.(day) ?? [];

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelectDay(day)}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {inRange ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: "50%",
                    marginTop: -RANGE_BAR / 2,
                    height: RANGE_BAR,
                    // Endpoints fill from their own centre so the bar tucks
                    // under the circle; middle days span the whole cell, so
                    // neighbouring segments butt together into one bar.
                    left: isStart ? "50%" : 0,
                    right: isEnd ? "50%" : 0,
                    backgroundColor: `${t.primary}22`,
                    borderTopLeftRadius: isStart ? RANGE_BAR / 2 : 0,
                    borderBottomLeftRadius: isStart ? RANGE_BAR / 2 : 0,
                    borderTopRightRadius: isEnd ? RANGE_BAR / 2 : 0,
                    borderBottomRightRadius: isEnd ? RANGE_BAR / 2 : 0,
                  }}
                />
              ) : null}
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isEndpoint
                    ? t.primary
                    : isToday
                      ? t.border
                      : "transparent",
                }}
              >
                <Txt
                  size={15}
                  weight={isEndpoint || isToday ? "700" : "400"}
                  style={{
                    color: isEndpoint
                      ? t.onPrimary
                      : inMonth
                        ? t.text
                        : t.muted,
                  }}
                >
                  {day.getDate()}
                </Txt>
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 3,
                  flexDirection: "row",
                  gap: 2,
                }}
              >
                {dots.slice(0, 3).map((dot) => (
                  <View
                    key={dot.key}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: dot.color,
                    }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
