"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logOut } from "./actions";

export default function Profile({ onNavigate }: { onNavigate: () => void }) {
  const session = useSession();

  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.data?.user.image ?? undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {session.data?.user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {session.data?.user.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <Link href="/perfil">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={onNavigate}
          >
            <User />
            Perfil
          </DropdownMenuItem>
        </Link>

        <form action={logOut}>
          <button>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <LogOut /> Tancar sessió
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
