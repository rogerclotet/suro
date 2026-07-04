"use client";

import posthog from "posthog-js";
import type { ComponentPropsWithoutRef } from "react";

type Store = "google_play" | "app_store";

type TrackBadgeLinkProps = ComponentPropsWithoutRef<"a"> & {
  /** Which store badge was clicked, sent as the `store` event property. */
  store: Store;
};

/**
 * An app-store badge link that fires an `app_store_click` event on click.
 * Thin client wrapper so the server-rendered `AppBadges` can stay a server
 * component while still tracking outbound clicks.
 */
export function TrackBadgeLink({
  store,
  href,
  onClick,
  children,
  ...props
}: TrackBadgeLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        posthog.capture("app_store_click", { store });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
