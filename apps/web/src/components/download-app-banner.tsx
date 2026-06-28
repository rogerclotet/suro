"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { StoreBadge } from "@/app/[locale]/_components/store-badge";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";

const DISMISS_KEY = "suro:download-banner-dismissed-at";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type MobileOS = "ios" | "android" | "other";

function detectOS(): MobileOS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return "android";
  // iPadOS reports a desktop Safari UA, so fall back to the touch-capable Mac
  // signature to catch modern iPads.
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes the legacy non-standard flag instead.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_TTL_MS;
  } catch {
    // Storage unavailable (private mode / disabled) — show the banner.
    return false;
  }
}

/**
 * A slim, dismissable banner nudging PWA visitors toward the native app.
 * iOS/Android get a single store CTA; everyone else gets both links. It is
 * suppressed on the landing page (which already shows store badges) and when
 * running as an installed PWA. Dismissal is remembered for 30 days.
 */
export function DownloadAppBanner() {
  const t = useTranslations("downloadBanner");
  const pathname = usePathname();
  const [os, setOS] = useState<MobileOS | null>(null);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;
    setOS(detectOS());
  }, []);

  // `usePathname` is locale-stripped, so the landing route is exactly "/".
  if (os === null || pathname === "/") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Ignore — we just won't suppress the banner on the next load.
    }
    setOS(null);
  };

  return (
    <div
      className="relative flex shrink-0 flex-col gap-2 bg-secondary px-3 py-2 text-secondary-foreground sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:pr-12"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      {/* Reserve room on the first row for the corner dismiss on mobile. */}
      <div className="flex min-w-0 items-center gap-2 pr-8 sm:flex-1 sm:pr-0">
        <div className="shrink-0 rounded-lg bg-background p-1">
          <Image
            src="/logo.png"
            alt="Suro"
            width={28}
            height={28}
            className="size-7"
          />
        </div>
        <p className="min-w-0 font-medium text-sm leading-tight">
          {t("message")}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {(os === "ios" || os === "other") && (
          <StoreBadge store="app_store" imgClassName="h-9" />
        )}
        {(os === "android" || os === "other") && (
          <StoreBadge store="google_play" imgClassName="h-9" />
        )}
      </div>

      {/* Always pinned to the top-right corner, vertically centered on desktop. */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute top-1 right-1 shrink-0 sm:top-1/2 sm:right-2 sm:-translate-y-1/2"
      >
        <X />
      </Button>
    </div>
  );
}
