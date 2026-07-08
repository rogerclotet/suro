/** Registered in app.json and passed to the Android widget APIs. */
export const WIDGET_NAME = "SuroHome";

/** widget instance id → project id */
export const WIDGET_CONFIG_KEY = "suro.widgetConfigs";

/** Last known auth + locale for headless widget refreshes. */
export const WIDGET_AUTH_KEY = "suro.widgetAuth";

export function widgetSnapshotKey(projectId: string): string {
  return `suro.widgetSnapshot:${projectId}`;
}

/** Matches the Home dashboard look-ahead window. */
export const UPCOMING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Max rows per section on the widget. */
export const PREVIEW_LIMIT = 3;

/** Android periodic refresh minimum enforced by the platform (30 minutes). */
export const WIDGET_UPDATE_PERIOD_MS = 30 * 60 * 1000;
