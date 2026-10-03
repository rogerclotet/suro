// @vitest-environment jsdom
import { api } from "backend/convex/_generated/api";
import { getFunctionName } from "convex/server";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WidgetSyncBridge } from "./WidgetSyncBridge";

const state = vi.hoisted(() => ({
  auth: { isLoading: true, isAuthenticated: false },
  storedAuthenticated: true,
  query: vi.fn(),
  persistentQuery: vi.fn(),
  writeAuth: vi.fn(),
  persist: vi.fn(),
  refresh: vi.fn(async () => {}),
  capture: vi.fn(),
}));
// Replace network and native boundaries; run the bridge's real React effects.
vi.mock("convex/react", () => {
  const client = { query: state.query };
  return {
    useConvexAuth: () => state.auth,
    useConvex: () => client,
  };
});
vi.mock("react-native", () => ({ Platform: { OS: "android" } }));
vi.mock("posthog-react-native", () => {
  const posthog = { captureException: state.capture };
  return { usePostHog: () => posthog };
});
vi.mock("@/lib/offline", () => ({
  useAuthGate: () => ({ isAuthenticated: state.storedAuthenticated }),
  usePersistentQuery: state.persistentQuery,
}));
vi.mock("@/lib/use-today-anchor", () => ({
  useTodayAnchor: () => ({ from: 0, to: 1 }),
}));
vi.mock("./auth-state", () => ({ writeWidgetAuth: state.writeAuth }));
vi.mock("./config", () => ({ configuredProjectIds: () => ["group"] }));
vi.mock("./sync", () => ({
  persistProjectSnapshot: state.persist,
  refreshAllWidgets: state.refresh,
}));

let root: Root;
async function render() {
  await act(async () => root.render(createElement(WidgetSyncBridge)));
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  state.auth = { isLoading: true, isAuthenticated: false };
  state.storedAuthenticated = true;
  state.query.mockReset().mockImplementation(async (query) => {
    return getFunctionName(query) === "lists:homePreviews"
      ? { previews: [], favoriteIds: [] }
      : [];
  });
  root = createRoot(document.createElement("div"));
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

it("keeps cached widgets signed in without requesting protected data until auth is confirmed", async () => {
  await render();
  expect(state.query.mock.calls.length).toBe(0);
  expect(state.persistentQuery).toHaveBeenLastCalledWith(api.users.me, "skip");
  expect(state.writeAuth).toHaveBeenLastCalledWith(true, "ca");
  expect(state.refresh).toHaveBeenCalled();
  expect(state.persist).not.toHaveBeenCalled();

  state.auth = { isLoading: false, isAuthenticated: true };
  await render();
  expect(state.query).toHaveBeenCalledWith(api.events.listByRange, {
    projectId: "group",
    from: 0,
    to: 1,
  });
  expect(state.query).toHaveBeenCalledTimes(3);
  expect(state.query).toHaveBeenCalledWith(api.lists.homePreviews, {
    projectId: "group",
    eventIds: [],
  });
  expect(
    state.query.mock.calls.map(([query]) => getFunctionName(query)),
  ).not.toContain("tasks:myTasks");
  expect(state.persist).toHaveBeenCalledTimes(1);
});

it("redraws signed-out widgets without fetching project data", async () => {
  state.auth = { isLoading: false, isAuthenticated: false };
  state.storedAuthenticated = false;
  await render();
  expect(state.query).not.toHaveBeenCalled();
  expect(state.writeAuth).toHaveBeenLastCalledWith(false, "ca");
  expect(state.refresh).toHaveBeenCalled();
});

it("handles a failed refresh without overwriting cached snapshots", async () => {
  state.auth = { isLoading: false, isAuthenticated: true };
  const error = new Error("Server Error");
  state.query.mockRejectedValue(error);
  await render();
  expect(state.persist).not.toHaveBeenCalled();
  expect(state.capture).toHaveBeenCalledWith(error, {
    action: "sync_android_widgets",
  });
});

it("discards an in-flight refresh when authentication is lost", async () => {
  state.auth = { isLoading: false, isAuthenticated: true };
  const pending = Promise.withResolvers<[]>();
  state.query.mockReturnValue(pending.promise);
  await render();

  state.auth = { isLoading: false, isAuthenticated: false };
  state.storedAuthenticated = false;
  await render();
  await act(async () => pending.resolve([]));
  expect(state.persist).not.toHaveBeenCalled();
  expect(state.capture).not.toHaveBeenCalled();
  expect(state.writeAuth).toHaveBeenLastCalledWith(false, "ca");
});
