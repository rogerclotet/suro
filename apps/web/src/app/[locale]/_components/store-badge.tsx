import Image from "next/image";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import { TrackBadgeLink } from "./track-badge-link";

export type Store = "google_play" | "app_store";

// Official brand lockups, served unoptimized so the artwork is never
// re-encoded. Heights are driven by the caller via `imgClassName`.
const BADGES: Record<
  Store,
  { href: string; src: string; alt: string; width: number; height: number }
> = {
  google_play: {
    href: PLAY_STORE_URL,
    src: "/badges/google-play.png",
    alt: "Get it on Google Play",
    width: 564,
    height: 168,
  },
  app_store: {
    href: APP_STORE_URL,
    src: "/badges/app-store.svg",
    alt: "Download on the App Store",
    width: 120,
    height: 40,
  },
};

type StoreBadgeProps = {
  store: Store;
  /** Sizing for the badge image, e.g. `h-12 sm:h-14`. */
  imgClassName?: string;
  className?: string;
};

/**
 * A single app-store badge link that tracks outbound clicks. Shared between
 * the marketing `AppBadges` and the in-app download banner so both render the
 * exact same official artwork and fire the same `app_store_click` event.
 */
export function StoreBadge({
  store,
  imgClassName,
  className,
}: StoreBadgeProps) {
  const badge = BADGES[store];
  return (
    <TrackBadgeLink
      store={store}
      href={badge.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <Image
        src={badge.src}
        alt={badge.alt}
        width={badge.width}
        height={badge.height}
        unoptimized
        className={cn("w-auto", imgClassName)}
      />
    </TrackBadgeLink>
  );
}
