import Image from "next/image";
import { cn } from "@/lib/utils";
import { TrackBadgeLink } from "./track-badge-link";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=dev.clotet.suro";

// Country-less smart link: Apple redirects each visitor to their own
// storefront and localizes the listing automatically. Hardcoding a country
// segment instead forces one store (and 404s where the app isn't sold).
const APP_STORE_URL = "https://apps.apple.com/app/id6780486033";

// Brand lockups are kept in English and served unoptimized so the official
// artwork is never re-encoded. Heights are matched across the two badges.
const BADGE_IMG = "h-12 w-auto sm:h-14";

type AppBadgesProps = {
  className?: string;
};

export default function AppBadges({ className }: AppBadgesProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-center gap-x-4 gap-y-3",
        className,
      )}
    >
      <TrackBadgeLink
        store="google_play"
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Image
          src="/badges/google-play.png"
          alt="Get it on Google Play"
          width={564}
          height={168}
          unoptimized
          className={BADGE_IMG}
        />
      </TrackBadgeLink>

      <TrackBadgeLink
        store="app_store"
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Image
          src="/badges/app-store.svg"
          alt="Download on the App Store"
          width={120}
          height={40}
          unoptimized
          className={BADGE_IMG}
        />
      </TrackBadgeLink>
    </div>
  );
}
