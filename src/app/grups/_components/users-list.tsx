import type { Project } from "@/app/_data/project";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function UsersList({ users }: { users: Project["users"] }) {
  return (
    <div className="flex flex-row -space-x-2">
      {users.slice(0, 3).map((user) => (
        <Tooltip key={user.user.id}>
          <TooltipTrigger>
            <UserAvatar
              className="avatar border-2 border-background"
              user={user.user}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.user.name}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {users.length > 3 && (
        <Tooltip>
          <TooltipTrigger>
            <Avatar className="avatar h-8 w-8 border-2 border-background">
              <AvatarFallback>+{users.length - 3}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{users.map((u) => u.user.name).join(", ")}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function UserAvatar({
  user,
  className,
}: {
  user: Project["users"][number]["user"];
  className?: string;
}) {
  return (
    <div key={user.id}>
      <div className="w-8">
        <Avatar className={cn("h-8 w-8", className)}>
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {user.name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
