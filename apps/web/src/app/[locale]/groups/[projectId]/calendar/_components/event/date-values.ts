const DAY_MS = 86_400_000;
type DateRange = { from?: Date; to?: Date };

/** All-day dates are UTC calendar days in storage and local calendar days in the picker. */
export function eventDatesForForm(event: {
  startAt: Date;
  endAt: Date;
  allDay: boolean;
}) {
  if (!event.allDay) return { from: event.startAt, to: event.endAt };
  const localDay = (date: Date) =>
    new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return {
    from: localDay(event.startAt),
    to: localDay(new Date(event.endAt.getTime() - DAY_MS)),
  };
}

/** The API accepts an inclusive all-day end; Convex converts it to exclusive storage. */
export function eventDatesForMutation({
  dates: { from, to },
  allDay,
}: {
  dates: DateRange;
  allDay: boolean;
}) {
  if (!from || !to) return null;
  const timestamp = (date: Date) =>
    allDay
      ? Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      : date.getTime();
  return { startAt: timestamp(from), endAt: timestamp(to), allDay };
}

export function selectEventDays(
  from: Date,
  to: Date,
  allDay: boolean,
  times?: { from: Date; to: Date },
  now = new Date(),
) {
  const start = new Date(from);
  let end = new Date(to);
  if (allDay) {
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
  } else {
    const defaultHour = Math.min(now.getHours() + 1, 22);
    start.setHours(
      times?.from.getHours() ?? defaultHour,
      times?.from.getMinutes() ?? 0,
      0,
      0,
    );
    end.setHours(
      times?.to.getHours() ?? defaultHour + 1,
      times?.to.getMinutes() ?? 0,
      0,
      0,
    );
    if (end <= start) {
      end = new Date(start);
      end.setHours(start.getHours() + 1);
    }
  }
  return { from: start, to: end };
}
