import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { useMenuItems } from "@/app/_components/navigation/use-menu-items";
import { useProjects } from "@/app/_state/project-state";
import LocaleLayout from "./layout";

vi.mock("@/styles/globals.css", () => ({}));
vi.mock("@fontsource/convergence/index.css", () => ({}));

// Replace request/network boundaries; keep the layout, project providers and
// navigation hook real so this catches consumers outside the provider.
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  ConvexAuthNextjsServerProvider: ({ children }: { children: ReactNode }) =>
    children,
}));
vi.mock("@/providers/convex-client-provider", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: () => [
    {
      _id: "household",
      name: "Our household",
      createdBy: "alice",
      inviteToken: "invite",
      color: "blue",
      members: [],
      categories: [],
    },
  ],
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ data: { user: { id: "alice" } } }),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "household" }),
}));
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}));
vi.mock("next-intl", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl")>()),
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({}));
vi.mock("@/app/_components/user-identifier", () => ({ default: () => null }));

// The server sidebar's auth/cookie reads require a Next request. Stand in for
// that shell, exercising its actual navigation hook alongside the page slot.
vi.mock(
  "@/app/_components/navigation/navigation-layout/sidebar-layout",
  () => ({
    default: ({ children }: { children: ReactNode }) => {
      const items = useMenuItems();
      const { project } = useProjects();
      return (
        <>
          <nav aria-label={project?.name}>
            {items.map((item) => (
              <span key={item.section}>{item.name}</span>
            ))}
          </nav>
          {children}
        </>
      );
    },
  }),
);

function Page() {
  const { project } = useProjects();
  return <main>{project?.name}</main>;
}

it.each(["ca", "es", "en"])(
  "renders signed-in navigation and page content in %s with the same group",
  async (locale) => {
    const layout = await LocaleLayout({
      params: Promise.resolve({ locale }),
      children: <Page />,
    });
    const html = renderToStaticMarkup(layout);
    expect(html).toContain('<nav aria-label="Our household">');
    expect(html).toContain("<span>lists</span>");
    expect(html).toContain("<main>Our household</main>");
  },
);
