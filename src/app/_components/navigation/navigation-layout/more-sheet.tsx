"use client";

import { LayoutGridIcon, LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Més</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4 pb-4">
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

          <div className="my-1 border-t border-border" />

          <Link
            href="/grups"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent [&_svg]:size-5"
          >
            <LayoutGridIcon />
            <span>Gestionar grups</span>
          </Link>

          <div className="my-1 border-t border-border" />

          <Link
            href="/perfil"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-accent"
          >
            <Avatar className="size-5 shrink-0">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {session?.user?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{session?.user?.name}</span>
              <span className="text-xs text-muted-foreground">
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
      </SheetContent>
    </Sheet>
  );
}
