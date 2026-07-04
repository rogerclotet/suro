import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Hourly so a timed task's reminder fires within ~1h of its due moment. All-day
// reminders are held to ~09:00 inside sendDueReminders (the app stores no
// per-user timezone, so a fixed server hour is the best available heuristic).
crons.hourly(
  "task due reminders",
  { minuteUTC: 0 },
  internal.tasks.sendDueReminders,
  {},
);

export default crons;
