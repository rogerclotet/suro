import {
  SiNotion,
  SiTelegram,
  SiWhatsapp,
} from "@icons-pack/react-simple-icons";
import { Home, Wallet } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CalendarDemo from "./_components/calendar-demo";
import ExpensesDemo from "./_components/expenses-demo";
import FeatureSection from "./_components/feature-section";
import FilesNotesDemo from "./_components/files-notes-demo";
import InfoStickyHeader from "./_components/info-sticky-header";
import ListsDemo from "./_components/lists-demo";

const AUTHOR_NAME = "Roger Clotet";
const AUTHOR_URL = "https://clotet.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "info" });
  return {
    title: t("heroTitle"),
    description: t("heroSubtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("info");

  const audience = [
    {
      title: t("audienceFlatmatesTitle"),
      body: t("audienceFlatmatesBody"),
    },
    {
      title: t("audienceFamiliesTitle"),
      body: t("audienceFamiliesBody"),
    },
    {
      title: t("audienceFriendsTitle"),
      body: t("audienceFriendsBody"),
    },
  ];

  const differentiators = [
    {
      title: t("diffSplitwiseTitle"),
      body: t("diffSplitwiseBody"),
      icons: [Wallet],
    },
    {
      title: t("diffChatsTitle"),
      body: t("diffChatsBody"),
      icons: [SiWhatsapp, SiTelegram],
    },
    {
      title: t("diffNotionTitle"),
      body: t("diffNotionBody"),
      icons: [SiNotion],
    },
    {
      title: t("diffFamilyAppsTitle"),
      body: t("diffFamilyAppsBody"),
      icons: [Home],
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <InfoStickyHeader title={t("heroTitle")} />

      <section className="relative px-6 pt-6 pb-16 md:pt-10 md:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 0%, oklch(0.78 0.14 80 / 0.22), transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight md:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground leading-relaxed md:text-lg">
            {t("heroSubtitle")}
          </p>
        </div>
        <div id="info-hero-sentinel" aria-hidden className="h-px" />
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
            {t("problemEyebrow")}
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
            {t("problemTitle")}
          </h2>
          <p className="mt-6 text-pretty text-base text-muted-foreground leading-relaxed md:text-lg">
            {t("problemBody")}
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
            {t("valueEyebrow")}
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
            {t("valueTitle")}
          </h2>
          <div className="mt-6 flex flex-col gap-4 text-pretty text-base text-muted-foreground leading-relaxed md:text-lg">
            <p>{t("valueBody1")}</p>
            <p>{t("valueBody2")}</p>
            <p>{t("valueBody3")}</p>
          </div>
        </div>
      </section>

      <div className="mt-8 border-border border-t bg-muted/30">
        <section className="px-6 pt-14 pb-2 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
              {t("featuresEyebrow")}
            </p>
            <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
              {t("featuresTitle")}
            </h2>
            <p className="mt-4 text-pretty text-base text-muted-foreground leading-relaxed">
              {t("featuresSubtitle")}
            </p>
          </div>
        </section>

        <FeatureSection
          eyebrow={t("demoListsEyebrow")}
          title={t("demoListsTitle")}
          body={t("demoListsBody")}
          demo={<ListsDemo />}
        />

        <FeatureSection
          eyebrow={t("demoExpensesEyebrow")}
          title={t("demoExpensesTitle")}
          body={t("demoExpensesBody")}
          demo={<ExpensesDemo />}
          reverse
        />

        <FeatureSection
          eyebrow={t("demoCalendarEyebrow")}
          title={t("demoCalendarTitle")}
          body={t("demoCalendarBody")}
          demo={<CalendarDemo />}
        />

        <FeatureSection
          eyebrow={t("demoFilesEyebrow")}
          title={t("demoFilesTitle")}
          body={t("demoFilesBody")}
          demo={<FilesNotesDemo />}
          reverse
        />

        <div className="border-border border-b" />
      </div>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
              {t("audienceEyebrow")}
            </p>
            <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
              {t("audienceTitle")}
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {audience.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-popover p-6 shadow-sm"
              >
                <h3 className="font-semibold text-lg text-popover-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
              {t("diffEyebrow")}
            </p>
            <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
              {t("diffTitle")}
            </h2>
            <p className="mt-6 text-pretty text-base text-muted-foreground leading-relaxed md:text-lg">
              {t("diffIntro")}
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {differentiators.map(({ title, body, icons }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-popover p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    {icons.map((Icon) => (
                      <Icon
                        key={Icon.displayName ?? Icon.name}
                        className="h-5 w-5"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <h3 className="font-semibold text-lg text-popover-foreground">
                    {title}
                  </h3>
                </div>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
            {t("roadmapEyebrow")}
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
            {t("roadmapTitle")}
          </h2>
          <p className="mt-6 text-pretty text-base text-muted-foreground leading-relaxed md:text-lg">
            {t("roadmapBody")}
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
            {t("monetizationEyebrow")}
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
            {t("monetizationTitle")}
          </h2>
          <div className="mt-8 rounded-xl border border-border bg-popover p-6 shadow-sm">
            <p className="font-semibold text-base text-popover-foreground">
              {t("monetizationPrimaryHeading")}
            </p>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed md:text-base">
              {t("monetizationPrimaryBody")}
            </p>
          </div>
          <p className="mt-8 font-semibold text-base text-foreground">
            {t("monetizationAltHeading")}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: t("monetizationAltSeasonalTitle"),
                body: t("monetizationAltSeasonalBody"),
              },
              {
                title: t("monetizationAltB2BTitle"),
                body: t("monetizationAltB2BBody"),
              },
              {
                title: t("monetizationAltSponsoredTitle"),
                body: t("monetizationAltSponsoredBody"),
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-popover p-5 shadow-sm"
              >
                <h3 className="font-medium text-popover-foreground text-sm">
                  {title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 pt-6 pb-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 border-border border-t pt-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Suro" width={24} height={24} />
            <span className="font-semibold text-foreground text-sm">Suro</span>
          </div>
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            {AUTHOR_NAME}
          </a>
        </div>
      </footer>
    </main>
  );
}
