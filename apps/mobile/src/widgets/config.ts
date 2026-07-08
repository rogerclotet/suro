import { readRaw, writeRaw } from "@/lib/offline/storage";
import { WIDGET_CONFIG_KEY } from "./constants";

/** Maps Android app-widget instance id → Convex project id. */
export type WidgetConfigMap = Record<string, string>;

function readConfigMap(): WidgetConfigMap {
  const raw = readRaw(WIDGET_CONFIG_KEY);
  if (raw === undefined || raw === "") {
    return {};
  }
  try {
    return JSON.parse(raw) as WidgetConfigMap;
  } catch {
    return {};
  }
}

function writeConfigMap(map: WidgetConfigMap): void {
  writeRaw(WIDGET_CONFIG_KEY, JSON.stringify(map));
}

export function getWidgetProjectId(widgetId: number): string | undefined {
  return readConfigMap()[String(widgetId)];
}

export function setWidgetProjectId(widgetId: number, projectId: string): void {
  const map = readConfigMap();
  map[String(widgetId)] = projectId;
  writeConfigMap(map);
}

export function removeWidgetProjectId(widgetId: number): void {
  const map = readConfigMap();
  delete map[String(widgetId)];
  writeConfigMap(map);
}

/** Distinct project ids bound to at least one home-screen widget instance. */
export function configuredProjectIds(): string[] {
  return [...new Set(Object.values(readConfigMap()))];
}

export function allWidgetInstanceIds(): number[] {
  return Object.keys(readConfigMap()).map((id) => Number(id));
}
