import * as Sentry from "@sentry/react-native";

export function captureException(error: unknown, context?: { action: string }) {
  Sentry.captureException(
    error,
    context ? { tags: { action: context.action } } : undefined,
  );
}

export async function flushErrors() {
  await Sentry.getClient()?.flush(2000);
}
