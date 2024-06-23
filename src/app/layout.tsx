import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import React from "react";
import BottomNav from "./_components/navigation/bottom-nav";
import Navbar from "./_components/navigation/navbar";
import { themes } from "./_data/themes";

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
        <ThemeProvider themes={[...themes]}>
          <div className="flex flex-col items-center justify-stretch">
            <Navbar />
            <div className="flex-grow lg:container">{children}</div>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
