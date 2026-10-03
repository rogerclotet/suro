"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ClientErrorButton() {
  const t = useTranslations("errorTest");

  function triggerClientError() {
    throw new Error("Suro client error reporting test");
  }

  return (
    <Button type="button" onClick={triggerClientError}>
      {t("clientError")}
    </Button>
  );
}
