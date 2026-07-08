import type { Locale } from "@/i18n/config";
import { readRaw, writeRaw } from "@/lib/offline/storage";
import { WIDGET_AUTH_KEY } from "./constants";

type WidgetAuthState = {
  signedIn: boolean;
  locale: Locale;
};

export function writeWidgetAuth(signedIn: boolean, locale: Locale): void {
  writeRaw(WIDGET_AUTH_KEY, JSON.stringify({ signedIn, locale }));
}

export function readWidgetAuth(): WidgetAuthState | null {
  const raw = readRaw(WIDGET_AUTH_KEY);
  if (raw === undefined || raw === "") {
    return null;
  }
  try {
    return JSON.parse(raw) as WidgetAuthState;
  } catch {
    return null;
  }
}
