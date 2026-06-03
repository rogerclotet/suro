"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { CURRENT_VERSION } from "@/data/changelog.generated";
import { useRouter } from "@/i18n/navigation";

const STORAGE_KEY = "suro:last-seen-version";

/**
 * Shows a toast the first time the app runs a version newer than the one the
 * user last saw, linking to the changelog. Detection is purely client-side:
 * the service worker is network-first, so a reload after a deploy already
 * delivers the new bundle (and thus a new CURRENT_VERSION).
 */
export function UpdateToast() {
  const t = useTranslations("changelog");
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    let previousVersion: string | null = null;
    try {
      previousVersion = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode / disabled) — nothing we can do.
      return;
    }

    if (previousVersion && previousVersion !== CURRENT_VERSION) {
      toast.info(t("updatedTitle", { version: CURRENT_VERSION }), {
        description: t("updatedDescription"),
        duration: 10000,
        action: {
          label: t("viewChanges"),
          onClick: () => router.push("/changelog"),
        },
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {
      // Ignore — we just won't suppress the toast on the next load.
    }
  }, [t, router]);

  return null;
}
