"use client";

import { ChevronsUpDownIcon, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import ThemeSwitcher from "../theme-switcher";
import { logOut } from "./actions";
import NotificationSwitcher from "./notification-toggle";

export default function Profile() {
  const session = useSession();
  const { isMobile, setOpenMobile } = useSidebar();

  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          tooltip={session.data?.user.name ?? "Perfil"}
          className="w-full justify-start gap-4"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.data?.user.image ?? undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {session.data?.user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
        <Link href="/perfil">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setOpenMobile(false)}
          >
            <User />
            Perfil
          </DropdownMenuItem>
        </Link>

        <NotificationSwitcher />

        <ThemeSwitcher />

        <DropdownMenuSeparator />

        <form action={logOut}>
          <button
            type="submit"
            className="w-full"
            onClick={() => setOpenMobile(false)}
          >
            <DropdownMenuItem className="cursor-pointer gap-2">
              <LogOut /> Tancar sessió
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
