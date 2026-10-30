// @vitest-environment jsdom
import type { Id } from "backend/convex/_generated/dataModel";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UnreadSection } from "./notification-routing";
import { NotificationsProvider } from "./notifications";

const state = vi.hoisted(() => ({
  pathname: "/groups",
  params: {} as { projectId?: string },
  unread: [] as UnreadSection[],
  markRead: vi.fn(async (_args: { projectId: string; ids: string[] }) => {}),
  appState: "active",
  onAppState: (_state: string) => {},
}));
// Replace framework boundaries; the provider and its read-on-visit effects run unchanged.
vi.mock("expo-router", () => ({
  usePathname: () => state.pathname,
  useGlobalSearchParams: () => state.params,
}));
vi.mock("react-native", () => ({
  AppState: {
    get currentState() {
      return state.appState;
    },
    addEventListener: (_event: string, listener: (next: string) => void) => {
      state.onAppState = listener;
      return { remove: () => {} };
    },
  },
}));
vi.mock("convex/react", () => ({ useMutation: () => state.markRead }));
vi.mock("@/lib/offline", () => ({
  useAuthGate: () => ({ isAuthenticated: true }),
  usePersistentQuery: () => state.unread,
}));

let root: Root;
async function render() {
  await act(async () =>
    root.render(createElement(NotificationsProvider, null)),
  );
}
type Item = { id: string; ids: string[]; gone?: boolean };
function lists(...items: Item[]): UnreadSection {
  const ids = items.flatMap((item) => item.ids) as Id<"notifications">[];
  return {
    projectId: "group" as Id<"projects">,
    section: "lists",
    count: ids.length,
    ids,
    latestId: ids[0] as Id<"notifications">,
    destination: { kind: "path", path: "/group/lists" },
    targets: items.map((item) => ({
      kind: "lists",
      id: item.id as Id<"lists">,
      ids: item.ids as Id<"notifications">[],
      count: item.ids.length,
      gone: item.gone ?? false,
      event: undefined,
    })),
  };
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  root = createRoot(document.createElement("div"));
  state.pathname = "/groups";
  state.params = {};
  state.unread = [];
  state.appState = "active";
  state.markRead.mockReset();
  state.markRead.mockImplementation(async () => {});
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

describe("notification visits", () => {
  it("leaves items unread on the section index and reads one when it opens", async () => {
    state.unread = [
      lists({ id: "groceries", ids: ["g1"] }, { id: "chores", ids: ["c1"] }),
    ];
    state.pathname = "/group/lists";
    await render();
    expect(state.markRead).not.toHaveBeenCalled();
    state.pathname = "/group/lists/groceries";
    await render();
    expect(state.markRead).toHaveBeenCalledExactlyOnceWith({
      projectId: "group",
      ids: ["g1"],
    });
  });

  it("reads changes arriving while the item is open, without repeating a request", async () => {
    state.pathname = "/group/home/list/groceries";
    state.unread = [lists({ id: "groceries", ids: ["g1"] })];
    await render();
    // The receipt is still listed until the server confirms the read.
    await render();
    state.unread = [
      lists(
        { id: "groceries", ids: ["g2", "g1"] },
        { id: "chores", ids: ["c1"] },
      ),
    ];
    await render();
    expect(state.markRead.mock.calls.map(([args]) => args.ids)).toEqual([
      ["g1"],
      ["g2"],
    ]);
  });

  it("clears only vanished items from a section index", async () => {
    state.pathname = "/group/lists";
    state.unread = [
      lists(
        { id: "deleted", ids: ["d1"], gone: true },
        { id: "chores", ids: ["c1"] },
      ),
    ];
    await render();
    expect(state.markRead).toHaveBeenCalledExactlyOnceWith({
      projectId: "group",
      ids: ["d1"],
    });
  });

  it("waits for the app to return to the foreground", async () => {
    state.appState = "background";
    state.pathname = "/group/lists/groceries";
    state.unread = [lists({ id: "groceries", ids: ["g1"] })];
    await render();
    expect(state.markRead).not.toHaveBeenCalled();
    await act(async () => state.onAppState("active"));
    expect(state.markRead).toHaveBeenCalledExactlyOnceWith({
      projectId: "group",
      ids: ["g1"],
    });
  });

  it("retries a failed read on the next update", async () => {
    state.markRead.mockRejectedValueOnce(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.pathname = "/group/lists/groceries";
    state.unread = [lists({ id: "groceries", ids: ["g1"] })];
    await render();
    state.unread = [lists({ id: "groceries", ids: ["g1"] })];
    await render();
    expect(state.markRead).toHaveBeenCalledTimes(2);
  });
});
