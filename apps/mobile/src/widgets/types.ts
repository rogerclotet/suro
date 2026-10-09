import type { Locale } from "@/i18n/config";

/** Date badge shown beside an event, mirroring the app's Home rows. */
export type WidgetEventDate = {
  day: number;
  /** Localized short month, e.g. "oct." */
  month: string;
  isToday: boolean;
};

export type WidgetEventRow = {
  id: string;
  name: string;
  /** Time of day only; the date lives in `date`. */
  when: string;
  /** Absent in snapshots cached before the badge existed, until the next sync. */
  date?: WidgetEventDate;
  /** Deep-link path inside the app, e.g. `/<projectId>/calendar/<eventId>`. */
  path: string;
};

export type WidgetListRow = {
  id: string;
  name: string;
  done: number;
  total: number;
  path: string;
};

export type WidgetLabels = {
  upcoming: string;
  featuredLists: string;
  noEvents: string;
  noLists: string;
  signIn: string;
  noGroup: string;
  configurePrompt: string;
  allDay: string;
  today: string;
};

export type WidgetSnapshot = {
  updatedAt: number;
  locale: Locale;
  signedIn: boolean;
  projectId?: string;
  projectName?: string;
  homePath?: string;
  labels: WidgetLabels;
  events: WidgetEventRow[];
  lists: WidgetListRow[];
};
