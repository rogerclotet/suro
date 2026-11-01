import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/app/_data/project";
import { currentSection, useSwitchGroup } from "./use-switch-group";

const state = vi.hoisted(() => ({
  pathname: "/groups/[projectId]/lists/[listId]",
  push: vi.fn((_href: string) => {}),
  selectProject: vi.fn((_project: Project | undefined) => {}),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: state.push }),
}));
vi.mock("@/app/_state/project-state", () => ({
  useProjects: () => ({ selectProject: state.selectProject }),
}));

const flat = { id: "flat", name: "Flat" } as Project;

beforeEach(() => {
  state.pathname = "/groups/[projectId]/lists/[listId]";
  state.push.mockReset();
  state.selectProject.mockReset();
});
afterEach(cleanup);

describe("switching group", () => {
  it("reads the section from a canonical group path", () => {
    expect(currentSection("/groups/[projectId]/lists/[listId]")).toBe("lists");
    expect(currentSection("/groups/[projectId]/home")).toBe("home");
    expect(currentSection("/groups")).toBeUndefined();
  });

  it("opens the other group in the same section, not the same item", () => {
    const { result } = renderHook(() => useSwitchGroup());
    result.current(flat);
    expect(state.selectProject).toHaveBeenCalledWith(flat);
    expect(state.push).toHaveBeenCalledWith("/groups/flat/lists");
  });

  it("falls back to Home from pages outside the sections", () => {
    state.pathname = "/groups/[projectId]/settings";
    const { result } = renderHook(() => useSwitchGroup());
    result.current(flat);
    expect(state.push).toHaveBeenCalledWith("/groups/flat/home");
  });
});
