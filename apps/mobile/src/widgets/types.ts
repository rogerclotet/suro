import type { Locale } from "@/i18n/config";

export type WidgetEventRow = {
  id: string;
  name: string;
  when: string;
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
