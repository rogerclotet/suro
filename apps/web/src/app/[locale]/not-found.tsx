"use client";

import { useLocale, useTranslations } from "next-intl";
import NotFoundContent from "@/components/not-found-content";

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations("errors");

  return (
    <NotFoundContent
      locale={locale}
      title={t("notFound")}
      description={t("notFoundDescription")}
      homeLabel={t("backHome")}
    />
  );
}
