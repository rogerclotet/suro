import {
  Bell,
  Calendar,
  FileText,
  Gift,
  ListChecks,
  PiggyBank,
} from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./language-switcher";
import PrivacyContent from "./privacy-content";
import PrivacyDialog from "./privacy-dialog";

const CONTACT_EMAIL = "suro@clotet.dev";

export default async function Landing() {
  const t = await getTranslations("landing");

  const features = [
    {
      icon: ListChecks,
      title: t("featureListsTitle"),
      body: t("featureListsBody"),
    },
    {
      icon: Calendar,
      title: t("featureCalendarTitle"),
      body: t("featureCalendarBody"),
    },
    {
      icon: FileText,
      title: t("featureFilesTitle"),
      body: t("featureFilesBody"),
    },
    {
      icon: PiggyBank,
      title: t("featureExpensesTitle"),
      body: t("featureExpensesBody"),
    },
    {
      icon: Gift,
      title: t("featureSecretSantaTitle"),
      body: t("featureSecretSantaBody"),
    },
    {
      icon: Bell,
      title: t("featureNotificationsTitle"),
      body: t("featureNotificationsBody"),
    },
  ];

  const useCases = [
    {
      title: t("useCaseFlatmatesTitle"),
      body: t("useCaseFlatmatesBody"),
    },
    {
      title: t("useCaseFamilyTitle"),
      body: t("useCaseFamilyBody"),
    },
    {
      title: t("useCaseFriendsTitle"),
      body: t("useCaseFriendsBody"),
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header
        className="px-6 pb-5"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Suro" width={36} height={36} priority />
            <span className="font-semibold text-foreground text-lg">Suro</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="outline">
              <Link href="/login">{t("navSignIn")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative px-6 pt-10 pb-16 md:pt-16 md:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 0%, oklch(0.78 0.14 80 / 0.22), transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
            {t("heroTagline")}
          </p>
          <h1 className="mt-4 text-balance font-semibold text-4xl text-foreground tracking-tight md:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">{t("heroCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="link">
              <Link href="/login">{t("heroCtaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-medium text-amber-700 text-sm uppercase tracking-[0.2em] dark:text-amber-300">
              {t("featuresEyebrow")}
            </p>
            <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
              {t("featuresTitle")}
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-popover p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg text-popover-foreground">
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
        <div className="mx-auto max-w-5xl">
          <h2 className="text-balance text-center font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
            {t("useCasesTitle")}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {useCases.map(({ title, body }) => (
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
        <div className="mx-auto max-w-3xl rounded-2xl bg-secondary px-8 py-12 text-center text-secondary-foreground shadow-lg md:px-12 md:py-16">
          <h2 className="text-balance font-semibold text-3xl tracking-tight md:text-4xl">
            {t("ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-secondary-foreground/80 leading-relaxed">
            {t("ctaBody")}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90"
          >
            <Link href="/login">{t("ctaButton")}</Link>
          </Button>
        </div>
      </section>

      <footer className="px-6 pt-6 pb-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 border-border border-t pt-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Suro" width={24} height={24} />
            <span className="font-semibold text-foreground text-sm">Suro</span>
          </div>
          <p className="text-muted-foreground text-sm sm:flex-1 sm:px-6 sm:text-center">
            {t("footerTagline")}
          </p>
          <nav className="flex items-center gap-5 text-sm">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footerContact")}
            </a>
            <PrivacyDialog
              trigger={
                <button
                  type="button"
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("footerPrivacy")}
                </button>
              }
            >
              <PrivacyContent />
            </PrivacyDialog>
          </nav>
        </div>
      </footer>
    </main>
  );
}
