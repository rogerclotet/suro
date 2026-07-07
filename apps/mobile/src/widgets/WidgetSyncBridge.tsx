import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { getLastProjectId } from "@/lib/last-project";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";
import { buildWidgetSnapshot, widgetEventBounds } from "./build-snapshot";
import { persistAndRefreshWidget } from "./sync";

/**
 * Keeps the Android home-screen widget in sync with the user's last group:
 * upcoming events and assigned tasks, formatted in their locale. Android-only;
 * renders nothing.
 */
export function WidgetSyncBridge() {
  const { isAuthenticated } = useAuthGate();
  const me = usePersistentQuery(api.users.me, isAuthenticated ? {} : "skip");
  const projects = usePersistentQuery(
    api.projects.listMine,
    isAuthenticated ? {} : "skip",
  );
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    getLastProjectId()
      .then(setStoredProjectId)
      .catch(() => setStoredProjectId(null));
  }, []);

  const projectId = useMemo(() => {
    if (!isAuthenticated || !projects) {
      return undefined;
    }
    if (
      storedProjectId &&
      projects.some((project) => project._id === storedProjectId)
    ) {
      return storedProjectId as Id<"projects">;
    }
    return projects[0]?._id;
  }, [isAuthenticated, projects, storedProjectId]);

  const bounds = useMemo(() => widgetEventBounds(), []);
  const events = usePersistentQuery(
    api.events.listByRange,
    projectId ? { projectId, from: bounds.from, to: bounds.to } : "skip",
  );
  const tasks = usePersistentQuery(
    api.tasks.myTasks,
    projectId ? { projectId } : "skip",
  );
  const project = usePersistentQuery(
    api.projects.get,
    projectId ? { projectId } : "skip",
  );

  const lastPayload = useRef<string>("");

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const snapshot = buildWidgetSnapshot({
      locale: me?.locale,
      signedIn: isAuthenticated,
      projectId,
      projectName: project?.name,
      events,
      tasks,
    });
    const payload = JSON.stringify(snapshot);
    if (payload === lastPayload.current) {
      return;
    }
    lastPayload.current = payload;
    persistAndRefreshWidget(snapshot);
  }, [isAuthenticated, me?.locale, projectId, project?.name, events, tasks]);

  return null;
}
