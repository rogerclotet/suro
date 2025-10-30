"use client";

import { AlertCircle } from "lucide-react";
import posthog from "posthog-js";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

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
