import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useMonthLabel, useWeekdayShortLabels } from "@/lib/datetime";
import { sameDay } from "@/lib/event-dates";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

/** The 6 week rows (7 days each) starting on the Monday on/before the 1st. */
function monthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Mon = 0
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from(
      { length: 7 },
      (_, weekday) =>
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + week * 7 + weekday,
        ),
    ),
  );
}

function isBetween(day: Date, start: Date, end: Date): boolean {
  const d = day.getTime();
  const lo = Math.min(start.getTime(), end.getTime());
  const hi = Math.max(start.getTime(), end.getTime());
  return d >= lo && d <= hi;
}

// Day tile size — large enough to hold the number with the event dots row
// tucked inside its bottom edge.
const DAY_TILE = 38;
// Height of the connecting range bar; matches the day tile so the highlight
// reads as one continuous band flowing through the endpoint squares.
const RANGE_BAR = DAY_TILE;
// Corner radius of the selected-day tile (and the range bar's outer ends), so
// selected days read as rounded squares rather than circles.
const DAY_RADIUS = 10;

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
  /**
   * Up to a few event markers per day; `key` must be stable (e.g. event id).
   * `onPrimary` is the dot color to use when the day carries the green
   * `primary` fill (the selected day); falls back to `color` when omitted.
   */
  dotsForDay?: (
    day: Date,
  ) => { key: string; color: string; onPrimary?: string }[];
}) {
  const t = useTheme();
  const weeks = monthWeeks(month);
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

      {/* Explicit 7-cell rows with flex:1 cells: sizing cells at `100/7%` and
          flex-wrapping overflows 100% by a rounding hair on Android, wrapping
          rows at 6 days and misaligning the grid from its weekday headers. */}
      {weeks.map((week) => (
        <View
          key={(week[0] as Date).toISOString()}
          style={{ flexDirection: "row" }}
        >
          {week.map((day) => {
            const inMonth = day.getMonth() === month.getMonth();
            const isToday = sameDay(day, today);
            const isStart = selectedStart ? sameDay(day, selectedStart) : false;
            const isEnd = selectedEnd ? sameDay(day, selectedEnd) : false;
            const isEndpoint = isStart || isEnd;
            // A range only exists when both ends are set to *different* days; a
            // lone selected day (or a same-day pick) just gets the endpoint square.
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
                  flex: 1,
                  aspectRatio: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {inRange ? (
                  <View
                    // Remount when the endpoint corners move (e.g. dragging an
                    // end across days): Android Fabric drops cached corner radii
                    // when styles mutate on a live view (see the tile below).
                    key={`bar-${isStart}-${isEnd}`}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: "50%",
                      marginTop: -RANGE_BAR / 2,
                      height: RANGE_BAR,
                      // Endpoints fill from their own centre so the bar tucks
                      // under the tile; middle days span the whole cell, so
                      // neighbouring segments butt together into one bar.
                      left: isStart ? "50%" : 0,
                      right: isEnd ? "50%" : 0,
                      backgroundColor: `${t.primary}22`,
                      borderTopLeftRadius: isStart ? DAY_RADIUS : 0,
                      borderBottomLeftRadius: isStart ? DAY_RADIUS : 0,
                      borderTopRightRadius: isEnd ? DAY_RADIUS : 0,
                      borderBottomRightRadius: isEnd ? DAY_RADIUS : 0,
                    }}
                  />
                ) : null}
                <View
                  // Android (Fabric, RN 0.85) loses a view's borderRadius when
                  // its backgroundColor changes after mount — tapping a day
                  // turned its tile into a sharp square. Keying the tile by its
                  // fill remounts it instead, applying the radius at creation.
                  key={isEndpoint ? "selected" : isToday ? "today" : "plain"}
                  style={{
                    width: DAY_TILE,
                    height: DAY_TILE,
                    borderRadius: DAY_RADIUS,
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
                  {/* Dots live inside the tile, right under the number, so on
                      a selected day they sit on the green fill (where the
                      opposite-scheme on-primary accents keep them legible). */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
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
                          // On the selected day's green fill, use the on-primary
                          // variant so the dot contrasts with the green.
                          backgroundColor: isEndpoint
                            ? (dot.onPrimary ?? dot.color)
                            : dot.color,
                        }}
                      />
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
