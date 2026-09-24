import {
  eventDatesForForm as datesForForm,
  eventDatesForMutation as datesForMutation,
} from "domain/events";

export { selectEventDays } from "domain/events";
export function eventDatesForForm(event: {
  startAt: Date;
  endAt: Date;
  allDay: boolean;
}) {
  return datesForForm({
    startAt: event.startAt.getTime(),
    endAt: event.endAt.getTime(),
    allDay: event.allDay,
  });
}
export function eventDatesForMutation({
  dates: { from, to },
  allDay,
}: {
  dates: { from?: Date; to?: Date };
  allDay: boolean;
}) {
  return from && to ? datesForMutation({ dates: { from, to }, allDay }) : null;
}
