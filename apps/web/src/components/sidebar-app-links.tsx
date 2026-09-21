"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { StoreBadge } from "@/app/[locale]/_components/store-badge";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "suro:download-banner-dismissed-at";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes the legacy non-standard flag instead.
    ("standalone" in navigator && navigator.standalone === true)
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
    // Show the links if browser storage is unavailable.
    return false;
  }
}

/** Native app links for the expanded desktop sidebar, dismissed for 30 days. */
export function SidebarAppLinks() {
  const t = useTranslations("downloadBanner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isStandalone() && !wasRecentlyDismissed());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Still dismiss for this visit if browser storage is unavailable.
    }
    setVisible(false);
  };

  return (
    <section
      aria-label={t("title")}
      className="hidden flex-col gap-3 border-sidebar-border border-b px-2 pt-2 pb-3 group-data-[collapsible=icon]:hidden md:flex"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-sidebar-foreground/70 text-xs">
          {t("title")}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          aria-label={t("dismiss")}
          className="-my-1 -mr-1 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <X />
        </Button>
      </div>
      <div className="flex flex-col items-start gap-2">
        <StoreBadge store="app_store" imgClassName="h-9" />
        <StoreBadge store="google_play" imgClassName="h-9" />
      </div>
    </section>
  );
}
