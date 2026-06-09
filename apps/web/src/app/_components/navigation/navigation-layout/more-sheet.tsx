"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  BellIcon,
  LayoutGridIcon,
  LogOut,
  MessageSquarePlusIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useFeedback } from "@/app/_state/feedback-state";
import { useNotifications } from "@/app/_state/notification-state";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import UserAvatar from "@/components/user-avatar";
import { CURRENT_VERSION } from "@/data/changelog.generated";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import NotificationDot from "../../notifications/notification-dot";
import type { MenuItem } from "../use-menu-items";

export default function MoreSheet({
  open,
  onOpenChange,
  overflowItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overflowItems: MenuItem[];
}) {
  const { data: session } = useSession();
  const { signOut } = useAuthActions();
  const { totalUnread } = useNotifications();
  const { openFeedback } = useFeedback();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tChangelog = useTranslations("changelog");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85dvh] flex-col px-4 pb-4">
        <DrawerHeader className="shrink-0 px-0">
          <DrawerTitle>{t("more")}</DrawerTitle>
        </DrawerHeader>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          data-vaul-no-drag
        >
          {overflowItems.map((item) =>
            item.href === "#" ? (
              <button
                key={item.name}
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href as never}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ),
          )}

          <div className="my-1 border-border border-t" />

          <Link
            href="/notifications"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
          >
            <span className="relative">
              <BellIcon />
              <NotificationDot count={totalUnread} />
            </span>
            <span>{t("notifications")}</span>
            {totalUnread > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                {totalUnread}
              </span>
            )}
          </Link>

          <Link
            href="/groups"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
          >
            <LayoutGridIcon />
            <span>{t("manageGroups")}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              openFeedback();
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
          >
            <MessageSquarePlusIcon />
            <span>{t("feedback")}</span>
          </button>

          <div className="my-1 border-border border-t" />

          <Link
            href="/profile"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent"
          >
            <UserAvatar user={session?.user ?? {}} className="size-5" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">{session?.user?.name}</span>
              <span className="text-muted-foreground text-xs">
                {session?.user?.email}
              </span>
            </div>
          </Link>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-destructive transition-colors hover:bg-accent [&_svg]:size-5"
            onClick={() => {
              onOpenChange(false);
              void signOut();
            }}
          >
            <LogOut />
            <span>{tAuth("signOut")}</span>
          </button>

          <div className="my-1 border-border border-t" />

          <Link
            href="/changelog"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-muted-foreground text-xs transition-colors hover:bg-accent"
          >
            <span>{tChangelog("versionLabel")}</span>
            <span>v{CURRENT_VERSION}</span>
          </Link>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
