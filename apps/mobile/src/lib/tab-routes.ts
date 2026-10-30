/**
 * Detail routes that stay inside the tab that opened them, so Back returns to
 * where the user came from. Pushing another tab's route instead switches tabs,
 * and its stack may hold only that screen, leaving no way back.
 *
 * Home and Calendar both host the event screen and the list, note and pot
 * screens attached to an event.
 */
export type HostTab = "home" | "calendar";
export type AttachedScreen = "list" | "note" | "expense";

/** The hosting tab of a route under `/<projectId>/<tab>/…`. */
export function hostTab(pathname: string): HostTab {
  return pathname.split("/").filter(Boolean)[1] === "home"
    ? "home"
    : "calendar";
}

export function eventRoute(projectId: string, tab: HostTab, eventId: string) {
  return tab === "home"
    ? `/${projectId}/home/event/${eventId}`
    : `/${projectId}/calendar/${eventId}`;
}

export function attachedRoute(
  projectId: string,
  tab: HostTab,
  screen: AttachedScreen,
  id: string,
) {
  return `/${projectId}/${tab}/${screen}/${id}`;
}
