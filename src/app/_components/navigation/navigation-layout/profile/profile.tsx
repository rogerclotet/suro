"use client";

import { ChevronsUpDownIcon, LogOut, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import UserAvatar from "@/components/user-avatar";
import { CURRENT_VERSION } from "@/data/changelog.generated";
import { Link } from "@/i18n/navigation";
import ThemeSwitcher from "../theme-switcher";
import { logOut } from "./actions";
import NotificationSwitcher from "./notification-toggle";

export default function Profile() {
  const session = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tChangelog = useTranslations("changelog");

  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="end"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
      >
        <Link href="/profile">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setOpenMobile(false)}
          >
            <User />
            {tNav("profile")}
          </DropdownMenuItem>
        </Link>

        <NotificationSwitcher />

        <ThemeSwitcher />

        <DropdownMenuSeparator />

        <Link href="/changelog">
          <DropdownMenuItem
            className="cursor-pointer justify-between gap-2 text-muted-foreground text-xs"
            onClick={() => setOpenMobile(false)}
          >
            <span>{tChangelog("versionLabel")}</span>
            <span>v{CURRENT_VERSION}</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <form action={logOut}>
          <button
            type="submit"
            className="w-full"
            onClick={() => setOpenMobile(false)}
          >
            <DropdownMenuItem className="cursor-pointer gap-2">
              <LogOut /> {tAuth("signOut")}
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
