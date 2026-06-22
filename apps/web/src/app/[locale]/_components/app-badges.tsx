import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { TrackBadgeLink } from "./track-badge-link";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=dev.clotet.suro";

// Brand lockups are kept in English and served unoptimized so the official
// artwork is never re-encoded. Heights are matched across the two badges.
const BADGE_IMG = "h-12 w-auto sm:h-14";

type AppBadgesProps = {
  className?: string;
};

export default async function AppBadges({ className }: AppBadgesProps) {
  const t = await getTranslations("landing");

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

      {/* iOS is still pending review — show the badge as a non-interactive teaser. */}
      <div className="flex flex-col items-center gap-1.5">
        <Image
          src="/badges/app-store.svg"
          alt="Download on the App Store"
          width={120}
          height={40}
          unoptimized
          className={cn(BADGE_IMG, "opacity-60")}
        />
        <span className="font-medium text-xs uppercase tracking-wide opacity-70">
          {t("iosComingSoon")}
        </span>
      </div>
    </div>
  );
}
