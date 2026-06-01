"use client";

import { AlertCircle, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isNetworkError } from "@/lib/is-network-error";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tCommon = useTranslations("common");
  // A flaky connection is expected and recoverable in an offline-capable PWA —
  // it isn't an application bug, so we present it gently instead of as a crash.
  const recoverable = isNetworkError(error);

  useEffect(() => {
    // Don't report transient network failures: they're noise, not bugs.
    if (recoverable) return;
    posthog.captureException(error);
  }, [error, recoverable]);

  // Retry automatically as soon as connectivity comes back.
  useEffect(() => {
    if (!recoverable) return;
    window.addEventListener("online", reset);
    return () => window.removeEventListener("online", reset);
  }, [recoverable, reset]);

  if (recoverable) {
    return (
      <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center p-4">
        <Alert className="max-w-lg bg-card">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>{tCommon("connectionError")}</AlertTitle>
          <AlertDescription>
            <p>{tCommon("connectionErrorBody")}</p>
            <div className="mt-4">
              <Button variant="ghost" onClick={() => reset()}>
                {tCommon("tryAgain")}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-lg bg-card">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{tCommon("error")}</AlertTitle>
        <AlertDescription>
          <p>{tCommon("errorOccurred")}</p>
          <p className="break-words italic">{error.message}</p>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => reset()}>
              {tCommon("tryAgain")}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
