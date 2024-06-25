import { auth } from "@/auth";
import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import React from "react";
import BottomNav from "./_components/navigation/bottom-nav";
import Drawer from "./_components/navigation/drawer";
import { themes } from "./_data/themes";

export const metadata = {
  title: "Família",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider themes={[...themes]}>
          <div className="flex flex-col items-center justify-stretch">
            <Drawer />
            <div className="w-full flex-grow px-4 py-4 lg:container">
              {children}
            </div>
            {session && <BottomNav />}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
