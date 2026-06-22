"use client";

import posthog from "posthog-js";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { Link } from "@/i18n/navigation";

type LoginLocation = "nav" | "hero" | "cta";

type TrackLoginLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  /** Which landing CTA was clicked, sent as the `location` event property. */
  location: LoginLocation;
};

/**
 * A localized `Link` to /login that fires a `web_login_click` event on click.
 * `forwardRef` + prop spreading keep it a drop-in for `<Button asChild>` (Radix
 * Slot clones the child and passes it a ref + the button's className).
 */
export const TrackLoginLink = forwardRef<
  HTMLAnchorElement,
  TrackLoginLinkProps
>(function TrackLoginLink({ location, onClick, ...props }, ref) {
  return (
    <Link
      {...props}
      ref={ref}
      onClick={(event) => {
        posthog.capture("web_login_click", { location });
        onClick?.(event);
      }}
    />
  );
});
