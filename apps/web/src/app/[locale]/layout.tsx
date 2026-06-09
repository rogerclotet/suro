import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ThemeColorMeta } from "@/components/theme-color-meta";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/touch-tooltip";
import { UpdateToast } from "@/components/update-toast";
import "@/styles/globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import "@fontsource/convergence/index.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import { extractRouterConfig } from "uploadthing/server";
import * as v from "valibot";
import SidebarLayout from "@/app/_components/navigation/navigation-layout/sidebar-layout";
import ProjectsProvider from "@/app/_components/projects-provider/projects-provider";
import UserIdentifier from "@/app/_components/user-identifier";
import { uploadFileRouter } from "@/app/api/uploadthing/core";
import { routing } from "@/i18n/routing";
import ConvexClientProvider from "@/providers/convex-client-provider";

// next-themes' ThemeProviderProps no longer carries `children` under React 19
// types; re-add it without changing runtime behavior.
const ThemeProvider = NextThemeProvider as ComponentType<
  ComponentProps<typeof NextThemeProvider> & { children?: ReactNode }
>;

const VALIBOT_LANG: Record<string, string> = {
  ca: "ca",
  es: "es",
  en: "en",
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function getSiteUrl(): URL | undefined {
  const fromEnv =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!fromEnv) return undefined;
  try {
    return new URL(fromEnv);
  } catch {
    return undefined;
  }
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

  return {
    metadataBase: getSiteUrl(),
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  viewportFit: "cover",
  // Single default that matches `defaultTheme="dark"` for first paint / no-JS.
  // `ThemeColorMeta` then keeps this in sync with the user's resolved theme,
  // which can differ from the system `prefers-color-scheme`.
  themeColor: "#17100c",
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

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang={locale} suppressHydrationWarning>
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
          <NextIntlClientProvider>
            <ConvexClientProvider>
              <UserIdentifier />

              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <ThemeColorMeta />
                <SidebarLayout>
                  <TooltipProvider>
                    <ProjectsProvider>
                      {children}
                      <Toaster position="bottom-center" />
                      <UpdateToast />
                    </ProjectsProvider>
                  </TooltipProvider>
                </SidebarLayout>
              </ThemeProvider>
            </ConvexClientProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
