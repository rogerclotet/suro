import { cn } from "@/lib/utils";
import { StoreBadge } from "./store-badge";

// Heights are matched across the two badges.
const BADGE_IMG = "h-12 sm:h-14";

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
      <StoreBadge store="google_play" imgClassName={BADGE_IMG} />
      <StoreBadge store="app_store" imgClassName={BADGE_IMG} />
    </div>
  );
}
