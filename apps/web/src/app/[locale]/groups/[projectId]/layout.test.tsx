import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import ProjectsProvider from "@/app/_components/projects-provider/projects-provider";
import ProjectLayout from "./layout";

const state = vi.hoisted(() => ({
  projectId: "missing",
  segment: "home",
  loading: false,
  authenticated: true,
  projectsLoaded: true,
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isAuthenticated: state.authenticated,
    isLoading: state.loading,
  }),
  useQuery: () =>
    state.projectsLoaded
      ? [{ _id: "accessible", name: "Our group", members: [], categories: [] }]
      : undefined,
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({
    data: state.authenticated ? { user: { id: "alice" } } : null,
    status: state.loading ? "loading" : "authenticated",
  }),
}));
vi.mock("@/lib/convex/server", () => ({ getAuthToken: vi.fn() }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useParams: () => ({ projectId: state.projectId }),
  useSelectedLayoutSegment: () => state.segment,
}));
vi.mock("next-intl", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl")>()),
  useTranslations: () => (key: string) => key,
}));

const page = vi.fn(() => <p>Group content</p>);

function renderRoute() {
  const Page = page;
  return renderToStaticMarkup(
    <ProjectsProvider>
      <ProjectLayout>
        <Page />
      </ProjectLayout>
    </ProjectsProvider>,
  );
}

beforeEach(() => {
  Object.assign(state, {
    projectId: "missing",
    segment: "home",
    loading: false,
    authenticated: true,
    projectsLoaded: true,
  });
  page.mockClear();
});

it.each(["missing", "not-a-convex-id", "another-users-group"])(
  "returns not found for %s before mounting project queries",
  (projectId) => {
    state.projectId = projectId;
    expect(renderRoute).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(page).not.toHaveBeenCalled();
  },
);

it("waits for the membership subscription instead of showing a false 404", () => {
  state.projectsLoaded = false;
  expect(renderRoute()).not.toContain("Group content");
  expect(page).not.toHaveBeenCalled();
});

it("waits for authentication before mounting project queries", () => {
  state.loading = true;
  state.authenticated = false;
  expect(renderRoute()).not.toContain("Group content");
  expect(page).not.toHaveBeenCalled();
});

it("renders accessible groups", () => {
  state.projectId = "accessible";
  expect(renderRoute()).toContain("Group content");
});

it.each([true, false])(
  "allows invitations without membership, authenticated=%s",
  (authenticated) => {
    state.segment = "invitation";
    state.authenticated = authenticated;
    expect(renderRoute()).toContain("Group content");
  },
);
