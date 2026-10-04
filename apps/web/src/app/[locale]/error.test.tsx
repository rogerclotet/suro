import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import GlobalError from "@/app/global-error";
import ca from "@/i18n/messages/ca.json";
import messages from "@/i18n/messages/en.json";
import { captureException } from "@/lib/error-reporting";
import ErrorPage from "./error";

vi.mock("@/lib/error-reporting", () => ({ captureException: vi.fn() }));
vi.mock("@/styles/globals.css", () => ({}));
vi.mock("@fontsource/convergence/index.css", () => ({}));
// next-intl's navigation module needs the Next runtime; keep this boundary out
// of the component test while exercising the real translation provider.
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ locale }: { locale: string }) => `/${locale}`,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function showError(error: Error, retry = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ErrorPage error={error} retry={retry} />
    </NextIntlClientProvider>,
  );
  return retry;
}

it("keeps technical errors in reporting and offers retry and a localized way home", () => {
  const error = new Error(
    "[CONVEX Q(events:listByRange)] private debug details",
  );
  const retry = showError(error);
  expect(screen.queryByText(/private debug details/)).toBeNull();
  expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  expect(captureException).toHaveBeenCalledWith(error);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(
    screen.getByRole("link", { name: "Back to home" }).getAttribute("href"),
  ).toBe("/en");
});

it("treats a lost connection as recoverable and retries when back online", () => {
  const retry = showError(new TypeError("Failed to fetch"));
  expect(screen.getByText(messages.common.connectionError)).toBeTruthy();
  expect(captureException).not.toHaveBeenCalled();
  fireEvent(window, new Event("online"));
  expect(retry).toHaveBeenCalledOnce();
  cleanup();
  fireEvent(window, new Event("online"));
  expect(retry).toHaveBeenCalledOnce();
});

it("renders the global fallback without any app providers", () => {
  const html = renderToStaticMarkup(
    <GlobalError error={new Error("private debug details")} retry={vi.fn()} />,
  );
  expect(html).toContain('<html lang="ca"');
  expect(html).toContain(ca.errors.unexpectedTitle);
  expect(html).not.toContain("private debug details");
});
