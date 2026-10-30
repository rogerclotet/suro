"use client";

import { useTranslations } from "next-intl";
import { UnreadBadge } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { HOME_SECTIONS } from "@/lib/home-sections";
import { menuSection, unreadCount } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";
import { cn } from "@/lib/utils";

/** Compact section shortcuts below the home date header. Wraps to a second row. */
export function HomeSectionChips({ projectId }: { projectId: string }) {
  const tNav = useTranslations("nav");
  const unread = useUnreadNotifications();

  return (
    <div className="flex flex-wrap gap-2">
      {HOME_SECTIONS.map((section) => {
        const Icon = section.icon;
        const notificationSection = menuSection(section.path);
        return (
          <Link
            key={section.key}
            href={{
              pathname: `/groups/[projectId]/${section.path}`,
              params: { projectId },
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5",
              "text-[13px] font-semibold text-foreground transition-opacity hover:opacity-70",
            )}
          >
            <Icon size={14} className="shrink-0 text-primary" aria-hidden />
            {tNav(section.key)}
            <UnreadBadge
              count={
                notificationSection
                  ? unreadCount(unread, projectId, notificationSection)
                  : 0
              }
            />
          </Link>
        );
      })}
    </div>
  );
}
