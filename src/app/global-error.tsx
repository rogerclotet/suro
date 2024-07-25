"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle } from "lucide-react";
import { useLogger } from "next-axiom";
import { LogLevel } from "next-axiom/dist/logger";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const pathname = usePathname();
  const log = useLogger({ source: "global-error.tsx" });
  const status = error.message == "Invalid URL" ? 404 : 500;

  log.logHttpRequest(
    LogLevel.error,
    error.message,
    {
      host: window.location.href,
      path: pathname,
      statusCode: status,
    },
    {
      error: error.name,
      cause: error.cause,
      stack: error.stack,
      digest: error.digest,
    },
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          <p>{"S'ha produït un error:"}</p>
          <p className="italic">{error.message}</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}