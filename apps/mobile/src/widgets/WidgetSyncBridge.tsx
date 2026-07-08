import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvex } from "convex/react";
import { useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { normalizeLocale } from "@/i18n/config";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";
import { writeWidgetAuth } from "./auth-state";
import { buildWidgetSnapshot, widgetEventBounds } from "./build-snapshot";
import { configuredProjectIds } from "./config";
import { persistProjectSnapshot, refreshAllWidgets } from "./sync";

/**
 * Keeps Android home-screen widgets in sync. Each widget instance shows the
 * group chosen in its configuration screen; snapshots are cached per project.
 */
export function WidgetSyncBridge() {
  const { isAuthenticated } = useAuthGate();
  const me = usePersistentQuery(api.users.me, isAuthenticated ? {} : "skip");
  const convex = useConvex();
  const bounds = useMemo(() => widgetEventBounds(), []);
  const locale = normalizeLocale(me?.locale);
  const lastSyncKey = useRef("");

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    let cancelled = false;

    async function sync() {
      writeWidgetAuth(isAuthenticated, locale);

      if (!isAuthenticated) {
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
        const pid = projectId as Id<"projects">;
        const [events, tasks, project] = await Promise.all([
          convex.query(api.events.listByRange, {
            projectId: pid,
            from: bounds.from,
            to: bounds.to,
          }),
          convex.query(api.tasks.myTasks, { projectId: pid }),
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
          tasks,
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

    void sync();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, locale, convex, bounds.from, bounds.to]);

  return null;
}
