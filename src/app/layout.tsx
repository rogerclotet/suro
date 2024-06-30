import { auth } from "@/auth";
import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import React from "react";
import { Toaster } from "sonner";
import * as v from "valibot";
import BottomNav from "./_components/navigation/bottom-nav";
import Drawer from "./_components/navigation/drawer/drawer";

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
      style={{ scrollbarGutter: "stable" }}
    >
      <body>
        <ThemeProvider defaultTheme="dark" enableSystem>
          <Drawer />
          <div className="mx-auto mb-16 mt-16 w-full flex-grow px-4 py-4 lg:container lg:mb-0">
            {children}
          </div>
          {session && <BottomNav />}

          <Toaster
            toastOptions={{
              unstyled: true,
              classNames: {
                success: "alert alert-success",
                error: "alert alert-error",
                warning: "alert alert-warning",
                info: "alert alert-info",
              },
            }}
            position="bottom-center"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
