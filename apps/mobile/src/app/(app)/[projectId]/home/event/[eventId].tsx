/**
 * An event opened from Home lives in the Home stack (not the calendar tab) so
 * the back button returns to the dashboard. Renders the same screen as
 * `calendar/[eventId]`, which opens its attached screens below `home/`.
 */
export { default } from "../../calendar/[eventId]";
