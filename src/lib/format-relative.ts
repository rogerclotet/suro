const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Formats a past date as a short relative label ("now", "2 hours ago"),
 * falling back to a localized day/month(/year) date once older than a week.
 */
export function formatRelative(date: Date, locale: string): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < MINUTE) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(0, "minute");
  }
  if (diff < HOUR) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-Math.floor(diff / MINUTE), "minute");
  }
  if (diff < DAY) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-Math.floor(diff / HOUR), "hour");
  }
  if (diff < 7 * DAY) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-Math.floor(diff / DAY), "day");
  }

  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
