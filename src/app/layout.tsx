import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import React from "react";
import BottomNav from "./_components/bottom-nav";
import Navbar from "./_components/navbar";

export const metadata = {
  title: "Família",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ca"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider themes={["night", "emerald"]}>
          <div className="flex min-h-screen flex-col items-center justify-stretch">
            <Navbar />
            <div className="flex-grow lg:container">{children}</div>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
