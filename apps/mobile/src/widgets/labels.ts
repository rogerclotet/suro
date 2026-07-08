import { DEFAULT_LOCALE, type Locale, MESSAGES } from "@/i18n/config";
import type { WidgetLabels } from "./types";

export function widgetLabels(locale: Locale | undefined): WidgetLabels {
  const messages = MESSAGES[locale ?? DEFAULT_LOCALE].mobile;
  return {
    upcoming: messages.home.upcoming,
    myTasks: messages.lists.myTasks,
    noEvents: messages.home.noUpcoming,
    noTasks: messages.lists.noTasks,
    signIn: messages.widget.signIn,
    noGroup: messages.widget.noGroup,
    configurePrompt: messages.widget.configurePrompt,
    allDay: messages.calendar.allDay,
  };
}
