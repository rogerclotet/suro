import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const CONTACT_EMAIL = "suro@clotet.dev";

export default function AccountDeletionContent() {
  const t = useTranslations("accountDeletion");

  const emailTag = (chunks: ReactNode) => (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="text-primary hover:underline"
    >
      {chunks}
    </a>
  );

  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <p>{t("intro")}</p>

      <Section title={t("inAppHeading")}>
        <p>{t("inAppIntro")}</p>
        <ol className="ml-5 list-decimal space-y-2">
          <li>{t("inAppStep1")}</li>
          <li>{t("inAppStep2")}</li>
          <li>{t("inAppStep3")}</li>
        </ol>
      </Section>

      <Section title={t("emailHeading")}>
        <p>{t.rich("emailBody", { email: emailTag })}</p>
      </Section>

      <Section title={t("dataHeading")}>
        <p>{t("dataIntro")}</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>{t("dataProfile")}</li>
          <li>{t("dataGroups")}</li>
          <li>{t("dataMemberships")}</li>
          <li>{t("dataDevices")}</li>
        </ul>
      </Section>

      <Section title={t("timingHeading")}>
        <p>{t("timingBody")}</p>
      </Section>

      <p className="text-muted-foreground">
        <Link href="/privacy" className="text-primary hover:underline">
          {t("privacyLink")}
        </Link>
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-base text-foreground">{title}</h2>
      {children}
    </section>
  );
}
