import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/touch-tooltip";
import ReactQueryProvider from "@/providers/react-query-provider";
import "@/styles/globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { GeistSans } from "geist/font/sans";
import { SessionProvider } from "next-auth/react";
import { AxiomWebVitals } from "next-axiom";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { extractRouterConfig } from "uploadthing/server";
import * as v from "valibot";
import BottomNav from "./_components/navigation/bottom-nav";
import Drawer from "./_components/navigation/drawer/drawer";
import ProjectsLoader from "./_components/projects-loader";
import UserIdentifer from "./_components/user-identifyer";
import { uploadFileRouter } from "./api/uploadthing/core";
import { CSPostHogProvider } from "./providers";

v.setGlobalConfig({ lang: "ca" });

export const metadata = {
  title: "Família",
  description: "Gestor familiar",
  icons: [{ rel: "icon", url: "/favicon.png" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html
      lang="ca"
      suppressHydrationWarning
      className={`${GeistSans.variable}`}
    >
      <AxiomWebVitals />
      <CSPostHogProvider>
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
                <TooltipProvider>
                  <Drawer />
                  <div className="mx-auto mb-20 mt-14 w-full grow px-4 py-4 lg:container lg:mb-4">
                    {children}
                  </div>
                  {session && (
                    <>
                      <ProjectsLoader />
                      <BottomNav />
                    </>
                  )}

                  <Toaster position="bottom-center" />
                </TooltipProvider>
              </ThemeProvider>
            </ReactQueryProvider>
          </SessionProvider>
        </body>
      </CSPostHogProvider>
    </html>
  );
}
