import { act, cleanup, render } from "@testing-library/react";
import type { Id } from "backend/convex/_generated/dataModel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UnreadSection } from "@/lib/notifications";
import { NotificationReader } from "./notification-reader";

const state = vi.hoisted(() => ({
  pathname: "/groups/[projectId]/home",
  params: { projectId: "group" } as Record<string, string>,
  unread: [] as UnreadSection[],
  markRead: vi.fn(async (_args: { projectId: string; ids: string[] }) => {}),
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useQuery: () => state.unread,
  useMutation: () => state.markRead,
}));
vi.mock("next/navigation", () => ({ useParams: () => state.params }));
vi.mock("@/i18n/navigation", () => ({ usePathname: () => state.pathname }));

function lists(...items: { id: string; ids: string[] }[]): UnreadSection {
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
      gone: false,
      event: undefined,
    })),
  };
}
let visibility: DocumentVisibilityState = "visible";
beforeEach(() => {
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(
    () => visibility,
  );
  state.pathname = "/groups/[projectId]/home";
  state.params = { projectId: "group" };
  state.unread = [
    lists({ id: "groceries", ids: ["g1"] }, { id: "chores", ids: ["c1"] }),
  ];
  state.markRead.mockReset();
  state.markRead.mockImplementation(async () => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("NotificationReader", () => {
  it("reads nothing on Home or the lists index, then only the opened list", () => {
    const view = render(<NotificationReader />);
    state.pathname = "/groups/[projectId]/lists";
    view.rerender(<NotificationReader />);
    expect(state.markRead).not.toHaveBeenCalled();
    state.pathname = "/groups/[projectId]/lists/[listId]";
    state.params = { projectId: "group", listId: "groceries" };
    view.rerender(<NotificationReader />);
    expect(state.markRead).toHaveBeenCalledExactlyOnceWith({
      projectId: "group",
      ids: ["g1"],
    });
  });

  it("waits until the tab is visible", () => {
    visibility = "hidden";
    state.pathname = "/groups/[projectId]/lists/[listId]";
    state.params = { projectId: "group", listId: "groceries" };
    render(<NotificationReader />);
    expect(state.markRead).not.toHaveBeenCalled();
    visibility = "visible";
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(state.markRead).toHaveBeenCalledExactlyOnceWith({
      projectId: "group",
      ids: ["g1"],
    });
  });
});
