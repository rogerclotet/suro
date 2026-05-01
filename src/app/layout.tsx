import { auth } from "@/auth";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ConflictModal } from "@/components/ui/conflict-modal";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/touch-tooltip";
import ReactQueryProvider from "@/providers/react-query-provider";
import "@/styles/globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import "@fontsource/convergence";
import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { extractRouterConfig } from "uploadthing/server";
import * as v from "valibot";
import { getFlags } from "@/server/flags";
import FlagsProvider from "./_components/flags-loader";
import SidebarLayout from "./_components/navigation/navigation-layout/sidebar-layout";
import NotificationProvider from "./_components/notifications/notification-provider";
import ProjectsProvider from "./_components/projects-provider/projects-provider";
import UserIdentifier from "./_components/user-identifier";
import { uploadFileRouter } from "./api/uploadthing/core";

v.setGlobalConfig({ lang: "ca" });

export const metadata: Metadata = {
  title: "Família",
  description: "Gestor familiar",
  icons: [{ rel: "icon", url: "/favicon.png" }],
  appleWebApp: {
    title: "Família",
    capable: true,
    statusBarStyle: "black-translucent",
    startupImage: "/favicon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#121621" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const flags = await getFlags();

  return (
    <html lang="ca" suppressHydrationWarning>
      <body>
        <ServiceWorkerRegister />
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(uploadFileRouter)}
        />
        <SessionProvider session={session}>
          <UserIdentifier />
          <FlagsProvider flags={flags} />

          <ReactQueryProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <SidebarLayout>
                <TooltipProvider>
                  <ProjectsProvider>
                    <NotificationProvider />
                    {children}
                    <Toaster position="bottom-center" />
                    <ConflictModal />
                  </ProjectsProvider>
                </TooltipProvider>
              </SidebarLayout>
            </ThemeProvider>
          </ReactQueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
