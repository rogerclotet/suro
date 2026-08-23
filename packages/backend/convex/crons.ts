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

// Pairing tickets expire within minutes and expiry is enforced at redemption;
// this just keeps unredeemed rows from piling up.
crons.daily(
  "prune expired watch pairings",
  { hourUTC: 3, minuteUTC: 30 },
  internal.watchPairings.pruneExpired,
  {},
);

export default crons;
