import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { parseLocaleParam } from "@/i18n/parse-locale";
import AccountDeletionContent from "../_components/account-deletion-content";
import LanguageSwitcher from "../_components/language-switcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = parseLocaleParam(localeParam);
  const t = await getTranslations({ locale, namespace: "accountDeletion" });
  return { title: t("title") };
}

export default async function AccountDeletionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = parseLocaleParam(localeParam);
  setRequestLocale(locale);
  const t = await getTranslations("accountDeletion");
  const tErrors = await getTranslations("errors");

  return (
    <main className="min-h-screen bg-background">
      <header
        className="px-6 pb-5"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Suro" width={32} height={32} />
            <span className="font-semibold text-foreground">Suro</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft />
                {tErrors("backHome")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pt-6 pb-20">
        <h1 className="font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <div className="mt-8">
          <AccountDeletionContent />
        </div>
      </article>
    </main>
  );
}
