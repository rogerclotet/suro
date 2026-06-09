"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ChevronsUpDownIcon, LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import UserAvatar from "@/components/user-avatar";
import { CURRENT_VERSION } from "@/data/changelog.generated";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import ThemeSwitcher from "../theme-switcher";
import NotificationSwitcher from "./notification-toggle";

export default function Profile() {
  const session = useSession();
  const { signOut } = useAuthActions();
  const { setOpenMobile } = useSidebar();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tChangelog = useTranslations("changelog");

  if (!session) {
    return null;
  }

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <SidebarMenuButton
          size="lg"
          tooltip={session.data?.user.name ?? tNav("profile")}
          className="w-full justify-start gap-4"
        >
          <UserAvatar user={session.data?.user ?? {}} />
          <div className="flex flex-col">
            <span>{session.data?.user.name}</span>
            <span className="text-muted-foreground text-xs">
              {session.data?.user.email}
            </span>
          </div>
          <ChevronsUpDownIcon className="ml-auto" />
        </SidebarMenuButton>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent
        side="right"
        align="end"
        title={session.data?.user.name ?? tNav("profile")}
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
      >
        <Link href="/profile">
          <ResponsiveMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setOpenMobile(false)}
          >
            <User />
            {tNav("profile")}
          </ResponsiveMenuItem>
        </Link>

        <NotificationSwitcher />

        <ThemeSwitcher />

        <ResponsiveMenuSeparator />

        <Link href="/changelog">
          <ResponsiveMenuItem
            className="cursor-pointer justify-between gap-2 text-muted-foreground text-xs"
            onClick={() => setOpenMobile(false)}
          >
            <span>{tChangelog("versionLabel")}</span>
            <span>v{CURRENT_VERSION}</span>
          </ResponsiveMenuItem>
        </Link>

        <ResponsiveMenuSeparator />

        <button
          type="button"
          className="w-full"
          onClick={() => {
            setOpenMobile(false);
            void signOut();
          }}
        >
          <ResponsiveMenuItem className="cursor-pointer gap-2">
            <LogOut /> {tAuth("signOut")}
          </ResponsiveMenuItem>
        </button>
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
