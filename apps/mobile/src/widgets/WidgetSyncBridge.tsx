import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvex, useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { normalizeLocale } from "@/i18n/config";
import { captureException } from "@/lib/error-reporting";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";
import { useTodayAnchor } from "@/lib/use-today-anchor";
import { writeWidgetAuth } from "./auth-state";
import { buildWidgetSnapshot } from "./build-snapshot";
import { configuredProjectIds } from "./config";
import { persistProjectSnapshot, refreshAllWidgets } from "./sync";

/**
 * Keeps Android home-screen widgets in sync. Each widget instance shows the
 * group chosen in its configuration screen; snapshots are cached per project.
 */
export function WidgetSyncBridge() {
  const { isAuthenticated } = useAuthGate();
  const { isAuthenticated: canQuery } = useConvexAuth();
  const me = usePersistentQuery(api.users.me, canQuery ? {} : "skip");
  const convex = useConvex();
  const bounds = useTodayAnchor();
  const locale = normalizeLocale(me?.locale);
  const lastSyncKey = useRef("");

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    let cancelled = false;

    async function sync() {
      writeWidgetAuth(isAuthenticated, locale);

      // Stored auth keeps offline widgets visible, but protected requests must
      // wait for Convex to confirm the token over the websocket.
      if (!isAuthenticated || !canQuery) {
        await refreshAllWidgets(locale);
        return;
      }

      const projectIds = configuredProjectIds();
      if (projectIds.length === 0) {
        await refreshAllWidgets(locale);
        return;
      }

      const snapshots: string[] = [];

      for (const projectId of projectIds) {
        if (cancelled) return;
        const pid = projectId as Id<"projects">;
        const [events, lists, project] = await Promise.all([
          convex.query(api.events.listByRange, {
            projectId: pid,
            from: bounds.from,
            to: bounds.to,
          }),
          convex.query(api.lists.homePreviews, {
            projectId: pid,
            eventIds: [],
          }),
          convex.query(api.projects.get, { projectId: pid }),
        ]);
        if (cancelled) {
          return;
        }
        const snapshot = buildWidgetSnapshot({
          locale,
          signedIn: true,
          projectId: pid,
          projectName: project?.name,
          events,
          lists,
        });
        persistProjectSnapshot(pid, snapshot);
        snapshots.push(JSON.stringify(snapshot));
      }

      const payload = `${locale}:${snapshots.join("|")}`;
      if (payload === lastSyncKey.current) {
        return;
      }
      lastSyncKey.current = payload;
      await refreshAllWidgets(locale);
    }

    void sync().catch((error: unknown) => {
      if (!cancelled) {
        captureException(error, { action: "sync_android_widgets" });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, canQuery, locale, convex, bounds.from, bounds.to]);

  return null;
}
