import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { eventWindowBounds } from "@/lib/event-dates";
import { UPCOMING_WINDOW_MS } from "@/widgets/constants";

/** Recomputes calendar-day bounds when the app returns to the foreground. */
export function useTodayAnchor(windowMs = UPCOMING_WINDOW_MS) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
      }
    });
    return () => sub.remove();
  }, []);

  return useMemo(() => eventWindowBounds(now, windowMs), [now, windowMs]);
}
