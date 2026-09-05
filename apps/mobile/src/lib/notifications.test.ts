// @vitest-environment jsdom
import type { Id } from "backend/convex/_generated/dataModel";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UnreadSection } from "./notification-routing";
import {
  NotificationsProvider,
  useCaptureNotificationVisit,
} from "./notifications";

const state = vi.hoisted(() => ({
  pathname: "/groups",
  params: {} as { projectId?: string; notification?: string; visit?: string },
  unread: [] as UnreadSection[],
  markRead: vi.fn(async () => {}),
}));
// Replace framework boundaries; the provider and its read-on-visit effects run unchanged.
vi.mock("expo-router", () => ({
  usePathname: () => state.pathname,
  useGlobalSearchParams: () => state.params,
  useRouter: () => ({ navigate: vi.fn() }),
}));
vi.mock("convex/react", () => ({ useMutation: () => state.markRead }));
vi.mock("@/lib/offline", () => ({
  useAuthGate: () => ({ isAuthenticated: true }),
  usePersistentQuery: () => state.unread,
}));

let root: Root;
let capture: ReturnType<typeof useCaptureNotificationVisit>;
function Probe() {
  capture = useCaptureNotificationVisit();
  return null;
}
async function render() {
  await act(async () =>
    root.render(
      createElement(NotificationsProvider, null, createElement(Probe)),
    ),
  );
}
function receipt(id: string): UnreadSection {
  return {
    projectId: "group" as Id<"projects">,
    section: "lists",
    count: 1,
    ids: [id as Id<"notifications">],
    latestId: id as Id<"notifications">,
    destination: { kind: "path", path: "/group/lists/list" },
  };
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  root = createRoot(document.createElement("div"));
  state.pathname = "/groups";
  state.params = {};
  state.unread = [];
  state.markRead.mockClear();
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

describe("notification visits", () => {
  it("reads once per section visit, preserving updates arriving while browsing its details", async () => {
    state.unread = [receipt("first")];
    await render();
    expect(state.markRead).not.toHaveBeenCalled();
    state.pathname = "/group/lists";
    await render();
    expect(state.markRead).toHaveBeenCalledWith({
      projectId: "group",
      ids: ["first"],
    });
    state.unread = [receipt("new")];
    state.pathname = "/group/lists/list";
    await render();
    state.pathname = "/group/lists";
    await render();
    expect(state.markRead).toHaveBeenCalledTimes(1);
    state.pathname = "/group/home";
    await render();
    state.pathname = "/group/lists";
    await render();
    expect(state.markRead).toHaveBeenLastCalledWith({
      projectId: "group",
      ids: ["new"],
    });
  });

  it("uses the tab-tap snapshot even when newer data arrives before native navigation finishes", async () => {
    const first = receipt("first");
    state.unread = [first];
    await render();
    capture(first);
    state.unread = [
      {
        ...receipt("new"),
        ids: ["new", "first"] as Id<"notifications">[],
        count: 2,
      },
    ];
    state.pathname = "/group/lists";
    await render();
    expect(state.markRead).toHaveBeenCalledWith({
      projectId: "group",
      ids: ["first"],
    });
    state.unread = [receipt("new")];
    state.pathname = "/group/lists/list";
    state.params = { notification: "first" };
    await render();
    expect(state.markRead).toHaveBeenCalledTimes(1);
  });

  it("does not clear a second snapshot when nested navigation removes or restores route parameters", async () => {
    state.pathname = "/group/lists";
    state.params = { notification: "first" };
    state.unread = [receipt("first")];
    await render();
    state.unread = [receipt("new")];
    state.pathname = "/group/lists/list";
    state.params = {};
    await render();
    state.pathname = "/group/lists";
    state.params = { notification: "first" };
    await render();
    expect(state.markRead).toHaveBeenCalledTimes(1);
  });

  it("handles another tab tap and a push tap when their section is already visible", async () => {
    state.pathname = "/group/lists/list";
    state.unread = [receipt("first")];
    await render();
    const second = receipt("second");
    state.unread = [second];
    await render();
    capture(second);
    state.params = { notification: "second" };
    await render();
    expect(state.markRead).toHaveBeenLastCalledWith({
      projectId: "group",
      ids: ["second"],
    });
    state.unread = [receipt("push")];
    state.params = { notification: "", visit: "push-request-id" };
    await render();
    expect(state.markRead).toHaveBeenLastCalledWith({
      projectId: "group",
      ids: ["push"],
    });
    expect(state.markRead).toHaveBeenCalledTimes(3);
  });
});
