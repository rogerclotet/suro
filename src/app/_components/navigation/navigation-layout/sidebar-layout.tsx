import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./app-sidebar/app-sidebar";
import SidebarInsetContent from "./sidebar-inset-content";

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

  if (!session) {
    return children;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-screen">
      <AppSidebar />

      <SidebarInset>
        <SidebarInsetContent>{children}</SidebarInsetContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
