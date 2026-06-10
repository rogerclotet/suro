"use client";

import NextError from "next/error";
import posthog from "posthog-js";
import { type ComponentType, useEffect } from "react";
import { isNetworkError } from "@/lib/is-network-error";

// next/error's class component type isn't a valid JSX component under React 19
// types; treat it as a plain component (runtime is unchanged).
const NextErrorPage = NextError as unknown as ComponentType<{
  statusCode: number;
}>;

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
        <NextErrorPage statusCode={0} />
      </body>
    </html>
  );
}
