"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const tCommon = useTranslations("common");

  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-lg bg-card">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{tCommon("error")}</AlertTitle>
        <AlertDescription>
          <p>{tCommon("errorOccurred")}</p>
          <p className="break-words italic">{error.message}</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
