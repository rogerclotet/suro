import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/touch-tooltip";
import ReactQueryProvider from "@/providers/react-query-provider";
import "@/styles/globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { GeistSans } from "geist/font/sans";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { extractRouterConfig } from "uploadthing/server";
import * as v from "valibot";
import SidebarLayout from "./_components/navigation/navigation-layout/sidebar-layout";
import ProjectsProvider from "./_components/projects-provider/projects-provider";
import UserIdentifer from "./_components/user-identifyer";
import { uploadFileRouter } from "./api/uploadthing/core";

v.setGlobalConfig({ lang: "ca" });

export const metadata = {
  title: "Família",
  description: "Gestor familiar",
  icons: [{ rel: "icon", url: "/favicon.png" }],
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <html
      lang="ca"
      suppressHydrationWarning
      className={`${GeistSans.variable}`}
    >
      <body>
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
          <UserIdentifer />
          <ReactQueryProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <SidebarLayout>
                <TooltipProvider>
                  <ProjectsProvider>
                    {children}
                    <Toaster position="bottom-center" />
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
