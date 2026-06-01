"use client";

import NextError from "next/error";
import posthog from "posthog-js";
import { useEffect } from "react";
import { isNetworkError } from "@/lib/is-network-error";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Transient network failures are recoverable, not bugs — don't report them.
    if (isNetworkError(error)) return;
    posthog.captureException(error);
  }, [error]);

  return (
    <html lang="ca">
      <body className="p-4">
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
