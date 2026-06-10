import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

const CONTACT_EMAIL = "suro@clotet.dev";

export default function PrivacyContent() {
  const t = useTranslations("privacy");

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
      <p className="text-muted-foreground">{t("effectiveDate")}</p>
      <p>{t("intro")}</p>

      <Section title={t("controllerHeading")}>
        <p>{t.rich("controllerBody", { email: emailTag })}</p>
      </Section>

      <Section title={t("dataHeading")}>
        <p>{t("dataIntro")}</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>{t("dataAccount")}</li>
          <li>{t("dataContent")}</li>
          <li>{t("dataPush")}</li>
          <li>{t("dataTechnical")}</li>
        </ul>
      </Section>

      <Section title={t("purposesHeading")}>
        <p>{t("purposesIntro")}</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>{t("purposesProvide")}</li>
          <li>{t("purposesAuth")}</li>
          <li>{t("purposesNotify")}</li>
          <li>{t("purposesImprove")}</li>
        </ul>
        <p>{t("purposesLegalBasis")}</p>
      </Section>

      <Section title={t("processorsHeading")}>
        <p>{t("processorsIntro")}</p>
        <dl className="space-y-3">
          <Processor
            title={t("processorNeonTitle")}
            body={t("processorNeonBody")}
          />
          <Processor
            title={t("processorGoogleTitle")}
            body={t("processorGoogleBody")}
          />
          <Processor
            title={t("processorResendTitle")}
            body={t("processorResendBody")}
          />
          <Processor
            title={t("processorUploadthingTitle")}
            body={t("processorUploadthingBody")}
          />
          <Processor
            title={t("processorPosthogTitle")}
            body={t("processorPosthogBody")}
          />
        </dl>
        <p className="text-muted-foreground">{t("transfersBody")}</p>
      </Section>

      <Section title={t("cookiesHeading")}>
        <p>{t("cookiesIntro")}</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>{t("cookiesAuth")}</li>
          <li>{t("cookiesPrefs")}</li>
          <li>{t("cookiesAnalytics")}</li>
        </ul>
      </Section>

      <Section title={t("retentionHeading")}>
        <p>{t.rich("retentionBody", { email: emailTag })}</p>
      </Section>

      <Section title={t("rightsHeading")}>
        <p>{t.rich("rightsBody", { email: emailTag })}</p>
      </Section>

      <Section title={t("changesHeading")}>
        <p>{t("changesBody")}</p>
      </Section>

      <Section title={t("contactHeading")}>
        <p>{t.rich("contactBody", { email: emailTag })}</p>
      </Section>
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

function Processor({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <dt className="font-medium text-foreground">{title}</dt>
      <dd className="mt-0.5 text-muted-foreground">{body}</dd>
    </div>
  );
}
