import type { Locale } from "@/i18n/config";

export type WidgetEventRow = {
  id: string;
  name: string;
  when: string;
  /** Deep-link path inside the app, e.g. `/<projectId>/calendar/<eventId>`. */
  path: string;
};

export type WidgetTaskRow = {
  id: string;
  name: string;
  listName: string;
  dueLabel?: string;
  overdue: boolean;
  /** Deep-link path inside the app, e.g. `/<projectId>/lists/<listId>`. */
  path: string;
};

export type WidgetLabels = {
  upcoming: string;
  myTasks: string;
  noEvents: string;
  noTasks: string;
  signIn: string;
  noGroup: string;
  allDay: string;
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
  tasks: WidgetTaskRow[];
};
