import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import BottomNav from "../bottom-nav";
import AppSidebar from "./app-sidebar/app-sidebar";
import Breadcrumbs from "./breadcrumbs";

export default async function SidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  if (!session) {
    return children;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs />
          </div>
        </header>

        <main className="mx-auto w-full grow px-4 py-4 lg:container">
          {children}
        </main>

        {/* {session && <BottomNav />} */}
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}
