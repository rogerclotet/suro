import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { ProjectSelectionProvider } from "./project-selection-provider";

const project = (id: string, name = id): Project => ({
  id,
  name,
  createdBy: "alice",
  inviteToken: "invite",
  image: null,
  color: "blue",
  features: { secretSanta: false },
  users: [],
  categories: [],
  secretSantas: [],
});
const projects = [project("a"), project("b")];
function Reader({ label }: { label: string }) {
  const { project: current, selectProject, isAdmin } = useProjects();
  return (
    <button
      type="button"
      onClick={() => selectProject(projects[1])}
      data-testid={label}
    >
      {current?.name ?? "none"}:{String(isAdmin)}
    </button>
  );
}
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("uses route identity on the first render and reads preferences once regardless of consumers", () => {
  localStorage.setItem("selectedProjectId:alice", "a");
  const read = vi.spyOn(localStorage, "getItem");
  const view = render(
    <ProjectSelectionProvider
      projects={projects}
      userId="alice"
      routeProjectId="b"
    >
      <Reader label="one" />
      <Reader label="two" />
    </ProjectSelectionProvider>,
  );
  expect(screen.getByTestId("one").textContent).toBe("b:true");
  expect(read).toHaveBeenCalledTimes(1);
  view.rerender(
    <ProjectSelectionProvider
      projects={[project("a"), project("b", "Renamed")]}
      userId="alice"
      routeProjectId="b"
    >
      <Reader label="one" />
    </ProjectSelectionProvider>,
  );
  expect(screen.getByTestId("one").textContent).toBe("Renamed:true");
  expect(read).toHaveBeenCalledTimes(1);
});

it("does not silently switch groups when route membership disappears", () => {
  const view = render(
    <ProjectSelectionProvider
      projects={projects}
      userId="alice"
      routeProjectId="b"
    >
      <Reader label="one" />
    </ProjectSelectionProvider>,
  );
  view.rerender(
    <ProjectSelectionProvider
      projects={[project("a")]}
      userId="alice"
      routeProjectId="b"
    >
      <Reader label="one" />
    </ProjectSelectionProvider>,
  );
  expect(screen.getByTestId("one").textContent).toBe("none:false");
});

it("uses account-scoped preferences off-route and clears the active group on sign-out", () => {
  localStorage.setItem("selectedProjectId:alice", "b");
  localStorage.setItem("selectedProjectId:bob", "a");
  const view = render(
    <ProjectSelectionProvider projects={projects} userId="alice">
      <Reader label="one" />
    </ProjectSelectionProvider>,
  );
  expect(screen.getByTestId("one").textContent).toBe("b:true");
  view.rerender(
    <ProjectSelectionProvider projects={projects} userId="bob">
      <Reader label="one" />
    </ProjectSelectionProvider>,
  );
  expect(screen.getByTestId("one").textContent).toBe("a:false");
  fireEvent.click(screen.getByTestId("one"));
  expect(screen.getByTestId("one").textContent).toBe("b:false");
  expect(localStorage.getItem("selectedProjectId:bob")).toBe("b");
  view.rerender(
    <ProjectSelectionProvider projects={projects} userId={null}>
      <Reader label="one" />
    </ProjectSelectionProvider>,
  );
  expect(screen.getByTestId("one").textContent).toBe("none:false");
});
