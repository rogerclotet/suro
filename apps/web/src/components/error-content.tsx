"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import PageFeedback from "@/components/page-feedback";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import { captureException } from "@/lib/error-reporting";
import { isNetworkError } from "@/lib/is-network-error";

export default function ErrorContent({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const tCommon = useTranslations("common");
  const t = useTranslations("errors");
  const locale = useLocale();
  // A flaky connection is expected and recoverable in an offline-capable PWA —
  // it isn't an application bug, so we present it gently instead of as a crash.
  const recoverable = isNetworkError(error);

  useEffect(() => {
    // Don't report transient network failures: they're noise, not bugs.
    if (recoverable) return;
    captureException(error);
  }, [error, recoverable]);

  // Retry automatically as soon as connectivity comes back.
  useEffect(() => {
    if (!recoverable) return;
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [recoverable, retry]);

  return (
    <PageFeedback
      kind={recoverable ? "offline" : "error"}
      title={recoverable ? tCommon("connectionError") : t("unexpectedTitle")}
      description={
        recoverable
          ? tCommon("connectionErrorBody")
          : t("unexpectedDescription")
      }
    >
      <Button size="lg" onClick={retry}>
        <RotateCcw aria-hidden="true" />
        {tCommon("tryAgain")}
      </Button>
      <Button asChild size="lg" variant="outline">
        <a href={getPathname({ href: "/", locale })}>
          <ArrowLeft aria-hidden="true" />
          {t("backHome")}
        </a>
      </Button>
    </PageFeedback>
  );
}
