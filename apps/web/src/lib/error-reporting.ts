import * as Sentry from "@sentry/nextjs";

export function captureException(error: unknown, context?: { action: string }) {
  Sentry.captureException(
    error,
    context ? { tags: { action: context.action } } : undefined,
  );
}
