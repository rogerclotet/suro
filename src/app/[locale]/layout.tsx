import { auth } from "@/auth";
import { InstallPromptButton } from "@/components/install-prompt-button";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ConflictModal } from "@/components/ui/conflict-modal";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/touch-tooltip";
import ReactQueryProvider from "@/providers/react-query-provider";
import "@/styles/globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import "@fontsource/convergence";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { extractRouterConfig } from "uploadthing/server";
import * as v from "valibot";
import FlagsProvider from "@/app/_components/flags-loader";
import SidebarLayout from "@/app/_components/navigation/navigation-layout/sidebar-layout";
import NotificationProvider from "@/app/_components/notifications/notification-provider";
import ProjectsProvider from "@/app/_components/projects-provider/projects-provider";
import UserIdentifier from "@/app/_components/user-identifier";
import { uploadFileRouter } from "@/app/api/uploadthing/core";
import { routing } from "@/i18n/routing";
import { getFlags } from "@/server/flags";

const VALIBOT_LANG: Record<string, string> = {
  ca: "ca",
  es: "es",
  en: "en",
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const title = t("title");
  const description = t("description");
  const ogImage = {
    url: "/android-chrome-512x512.png",
    width: 512,
    height: 512,
    alt: title,
  };

  return {
    title,
    description,
    icons: [{ rel: "icon", url: "/favicon.png" }],
    appleWebApp: {
      title,
      capable: true,
      statusBarStyle: "black-translucent",
      startupImage: "/favicon.png",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      siteName: title,
      images: [ogImage],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0e08" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  v.setGlobalConfig({ lang: VALIBOT_LANG[locale] ?? "en" });

  const session = await auth();
  const flags = await getFlags();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ServiceWorkerRegister />
        <InstallPromptButton />
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(uploadFileRouter)}
        />
        <NextIntlClientProvider>
          <SessionProvider session={session}>
            <UserIdentifier />
            <FlagsProvider flags={flags} />

            <ReactQueryProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <SidebarLayout>
                  <TooltipProvider>
                    <ProjectsProvider>
                      {session && <NotificationProvider />}
                      {children}
                      <Toaster position="bottom-center" />
                      <ConflictModal />
                    </ProjectsProvider>
                  </TooltipProvider>
                </SidebarLayout>
              </ThemeProvider>
            </ReactQueryProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
