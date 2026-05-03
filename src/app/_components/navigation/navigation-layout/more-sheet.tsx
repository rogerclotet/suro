"use client";

import { BellIcon, LayoutGridIcon, LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useNotifications } from "@/app/_state/notification-state";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import UserAvatar from "@/components/user-avatar";
import NotificationDot from "../../notifications/notification-dot";
import type { MenuItem } from "../use-menu-items";
import { logOut } from "./profile/actions";

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
  const { totalUnread } = useNotifications();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85dvh] flex-col px-4 pb-4">
        <DrawerHeader className="shrink-0 px-0">
          <DrawerTitle>Més</DrawerTitle>
        </DrawerHeader>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          data-vaul-no-drag
        >
          {overflowItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}

          <div className="my-1 border-border border-t" />

          <Link
            href="/notificacions"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
          >
            <span className="relative">
              <BellIcon />
              <NotificationDot count={totalUnread} />
            </span>
            <span>Notificacions</span>
            {totalUnread > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                {totalUnread}
              </span>
            )}
          </Link>

          <Link
            href="/grups"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
          >
            <LayoutGridIcon />
            <span>Gestionar grups</span>
          </Link>

          <div className="my-1 border-border border-t" />

          <Link
            href="/perfil"
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

          <form action={logOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-destructive transition-colors hover:bg-accent [&_svg]:size-5"
              onClick={() => onOpenChange(false)}
            >
              <LogOut />
              <span>Tancar sessió</span>
            </button>
          </form>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
