import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { type ChangeType, changelog } from "@/data/changelog.generated";
import { type Locale, routing } from "@/i18n/routing";
import { parseDateOnly } from "@/lib/date-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog" });
  return {
    title: t("pageTitle"),
    robots: { index: false, follow: false },
  };
}

const BADGE_VARIANT: Record<ChangeType, BadgeProps["variant"]> = {
  feature: "default",
  improvement: "secondary",
  fix: "outline",
};

const TYPE_LABEL: Record<
  ChangeType,
  "typeFeature" | "typeImprovement" | "typeFix"
> = {
  feature: "typeFeature",
  improvement: "typeImprovement",
  fix: "typeFix",
};

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("changelog");

  const uiLocale = (
    routing.locales.includes(locale as Locale) ? locale : routing.defaultLocale
  ) as Locale;
  const dateFormatter = new Intl.DateTimeFormat(uiLocale, {
    dateStyle: "long",
  });

  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto max-w-2xl px-6 pt-10 pb-20">
        <h1 className="font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {t("intro")}
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {changelog.map((entry) => {
            const changes =
              entry.changes[uiLocale] ??
              entry.changes[routing.defaultLocale] ??
              [];
            return (
              <section key={entry.version}>
                <div className="flex items-baseline gap-3">
                  <h2 className="font-semibold text-foreground text-xl tracking-tight">
                    v{entry.version}
                  </h2>
                  <span className="text-muted-foreground text-sm">
                    {dateFormatter.format(parseDateOnly(entry.date))}
                  </span>
                </div>
                <ul className="mt-4 flex flex-col gap-3">
                  {changes.map((change) => (
                    <li
                      key={`${change.type}-${change.text}`}
                      className="flex items-start gap-3"
                    >
                      <Badge
                        variant={BADGE_VARIANT[change.type]}
                        className="mt-0.5 shrink-0"
                      >
                        {t(TYPE_LABEL[change.type])}
                      </Badge>
                      <span className="text-foreground text-sm leading-relaxed">
                        {change.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </article>
    </main>
  );
}
