import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { pathnameHeader } from "@/proxy";
import AppSidebar from "./app-sidebar/app-sidebar";
import SidebarInsetContent from "./sidebar-inset-content";

// Routes that should render without the app sidebar even when the visitor is
// signed in. Matched against the pathname after stripping the locale prefix.
const STANDALONE_PATHS = ["/info"];

function isStandalonePath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  return STANDALONE_PATHS.some(
    (p) => stripped === p || stripped.startsWith(`${p}/`),
  );
}

export default async function SidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen =
    sidebarState === undefined ? true : sidebarState === "true";

  const requestHeaders = await headers();
  const pathname = requestHeaders.get(pathnameHeader) ?? "";

  if (!session || isStandalonePath(pathname)) {
    return children;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-dvh">
      <AppSidebar />

      <SidebarInset>
        <SidebarInsetContent>{children}</SidebarInsetContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
