import { auth, signOut } from "@/auth";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { LogOut } from "lucide-react";

export default async function Profile() {
  const session = await auth();
  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback>
              {session.user.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {session.user.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button>
            <DropdownMenuItem className="gap-2">
              <LogOut /> Tancar sessió
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
